import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import sendEmailFun from '../config/sendEmail.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';

export async function registerUserController(request, response) {
    try {
        let user;
        const { name, email, password } = request.body;
        if (!name || !email || !password) {
            return response.status(400).json({
                message: "provide email, name, password",
                error: true,
                success: false
            })
        }
        user = await UserModel.findOne({ email: email })
        if (user) {
            return response.json({
                message: "User already registered with the email",
                error: true,
                success: false
            })
        }
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        user = new UserModel({
            email: email,
            password: hashPassword,
            name: name,
            otp: verifyCode,
            otpExpires: Date.now() + 600000
        });

        await user.save();

        // Send verification email
        await sendEmailFun(
            email, // This populates the 'to' argument
            "Verify email from Space Biology Knowledge App", // This populates 'subject'
            "", // This populates 'text'
            VerificationEmail(name, verifyCode) // This populates 'html'
        );

        // Create a JWT token for verification purposes
        const token = jwt.sign(
            { email: user.email, id: user._id },
            process.env.JSON_WEB_TOKEN_SECRET_KEY
        );

        return response.status(200).json({
            success: true,
            error: false,
            message: "User registered successfully! Please verify your email.",
            token: token, // Optional: include this if needed for verification
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function verifyEmailController(request, response) {
    try {
        const { email, otp } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({ error: true, success: false, message: "User not found" });
        }

        const dbOtpString = String(user.otp);

        // Use the stringified DB value for the comparison
        const isCodeValid = dbOtpString === otp;
        const isNotExpired = user.otpExpires > Date.now();

        if (!isNotExpired) {
            // Check expiration first and exit if expired
            return response.status(400).json({
                error: true,
                success: false,
                message: "OTP expired" // Correct message for expired
            });
        }

        if (!isCodeValid) {
            // Check validity next and exit if invalid
            return response.status(400).json({
                error: true,
                success: false,
                message: "Invalid OTP" // Correct message for wrong code
            });
        }

        // If the code reaches here, it is both VALID and NOT EXPIRED (SUCCESS)
        // SUCCESS Block:
        user.verify_email = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();
        return response.status(200).json({
            success: true,
            error: false,
            message: "Email verified successfully! You are now logged in."
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function loginUserController(request, response) {
    try {
        const { email, password } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "User not register",
                error: true,
                success: false
            });
        }

        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Contact to admin",
                error: true,
                success: false
            });
        }
        if (user.verify_email !== true) {
            return response.status(400).json({
                message: "Your Email is not verified yet! Please Verify Your email",
                error: true,
                success: false
            });
        }

        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return response.status(400).json({
                message: "Check your password",
                error: true,
                success: false
            });
        }

        const accessToken = await generatedAccessToken(user._id);
        const refreshToken = await generatedRefreshToken(user._id);

        const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
            last_login_date: new Date()
        });

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        response.cookie('accessToken', accessToken, cookiesOption);
        response.cookie('refreshToken', refreshToken, cookiesOption);

        return response.json({
            message: "Login successfully",
            error: false,
            success: true,
            data: {
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}

export async function logoutController(request, response) {
    try {
        const userId = request.userId; // auth middleware

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        // 1. Clear Cookies on the Client Side
        response.clearCookie("accessToken", cookiesOption);
        response.clearCookie("refreshToken", cookiesOption);

        // 2. Clear Token in the Database
        const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
            refresh_token: ""
        });

        // 3. Send Final Success Response
        return response.json({
            message: "Logout successfully",
            error: false,
            success: true
        });
    } catch (error) {
        // 4. Handle Errors
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// update user details
export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId; // auth middleware
        const { name, email, mobile, password } = request.body;

        const userExist = await UserModel.findById(userId);

        if (!userExist) {
            return response.status(400).send('The user cannot be Updated!');
        }

        let verifyCode = "";

        if (email !== userExist.email) {
            verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        let hashPassword = "";

        if (password) {
            const salt = await bcryptjs.genSalt(10);
            hashPassword = await bcryptjs.hash(password, salt);
        } else {
            hashPassword = userExist.password;
        }

        const updateUser = await UserModel.findByIdAndUpdate(
            userId,
            {
                name: name,
                mobile: mobile,
                email: email,
                verify_email: email !== userExist.email ? false : userExist.verify_email,
                password: hashPassword,
                otp: verifyCode ? verifyCode : null,
                otpExpires: verifyCode ? Date.now() + 600000 : null,
            },
            { new: true }
        );

        if (email !== userExist.email) {
            // Send verification email
            await sendEmailFun(
                email, // Argument 1: to
                "Verify email from Ecommerce App", // Argument 2: subject
                "", // Argument 3: text
                VerificationEmail(name, verifyCode) // Argument 4: html
            );
        }
        return response.json({
            message: "User Updated successfully",
            error: false,
            success: true,
            user: {
                name:updateUser?.name,
                _id:updateUser?._id,
                email:updateUser?.email,
                mobile:updateUser?.mobile,
                avatar:updateUser?.avatar
            }
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// forgot password
export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            });
        } else {
            let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = verifyCode;
            user.otpExpires = Date.now() + 600000;
            await user.save();

            await sendEmailFun(
                user.email, // Argument 1: to (using user.email from the database)
                "Verify OTP from NASA Space Biology App", // Argument 2: subject
                "", // Argument 3: text
                VerificationEmail(user.name, verifyCode) // Argument 4: html
            );
            return response.json({
                message: "check your email",
                error: false,
                success: true
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body;
        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            });
        }
        if (!email || !otp) {
            return response.status(400).json({
                message: "Provide required field email, otp.",
                error: true,
                success: false
            });
        }
        if (otp !== user.otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }
        const currentTime = new Date().toISOString();
        if (user.otpExpires < currentTime) {
            return response.status(400).json({
                message: "Otp is expired",
                error: true,
                success: false
            });
        }

        user.otp = "";
        user.otpExpires = "";
        await user.save();

        return response.status(200).json({
            message: "OTP Verified Successfully!!",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// reset password
export async function resetPassword(request, response) {
    try {
        const { email, oldPassword,newPassword, confirmPassword } = request.body;

        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                message: "provide required fields email, newPassword, confirmPassword",
                error: true,
                success: false
            });
        }
        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email is not available",
                error: true,
                success: false
            });
        }
        if (oldPassword) {
            const checkPassword = await bcryptjs.compare(oldPassword, user.password);
            if(!checkPassword){
                return response.status(400).json({
                    message: "Your Old Password is Wrong",
                    error: true,
                    success: false,
                });
            }
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "newPassword and confirmPassword must be same.",
                error: true,
                success: false,
            });
        }
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        user.password = hashPassword;
        await user.save();

        return response.json({
            message: "Password updated successfully.",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


// refresh token controller
export async function refreshToken(request, response) {
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]; // Bearer token

        if (!refreshToken) {
            return response.status(401).json({
                message: "Invalid token",
                error: true,
                success: false
            });
        }

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
        if (!verifyToken) {
            return response.status(401).json({
                message: "token is expired",
                error: true,
                success: false
            });
        }

        const userId = verifyToken?.id; // Note: Payload ID is usually 'id', not '_id' unless mapped manually
        const newAccessToken = await generatedAccessToken(userId);

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        response.cookie('accessToken', newAccessToken, cookiesOption);
        return response.json({
            message: "New Access token generated",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// get-login-user-details
export async function userDetails(request, response) {
  try {
    const userId = request.userId; // Retrieved from the 'auth' middleware

    const user = await UserModel.findById(userId).select('-password -refresh_token');

    return response.json({
      message: 'user details',
      data: user,
      error: false,
      success: true
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false
    });
  }
}