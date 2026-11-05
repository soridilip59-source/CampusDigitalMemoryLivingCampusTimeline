require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = "dilip@example.com"; // Replace with the email of the user whose password you want to reset
        const newPassword = "Dilip@12345";

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const result = await User.updateOne(
            { email: email.toLowerCase().trim() },
            {
                $set: {
                    password: hashedPassword,
                    role: "admin"
                }
            }
        );

        if (result.matchedCount === 0) {
            console.log("User not found!");
        } else {
            console.log("Password reset successfully!");
            console.log("Your role is now admin.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

resetPassword();