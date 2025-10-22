import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Provide name"]
    },
    email: {
        type: String,
        required: [true, "Provide email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Provide password"],
    },
    verify_email: {
        type: Boolean,
        default: false
    },
    access_token: {
        type: String,
        default: ''
    },
    refresh_token: {
        type: String,
        default: ''
    },
    last_login_date: {
        type: Date,
        default: ''
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
      status: {
        type: String,
        enum: ["Active", "Inactive", "Suspended"],
        default: "Active"
    }

},
    { timestamps: true }
)
//testing
const UserModel = mongoose.model("userbiospace",userSchema);
export default UserModel;