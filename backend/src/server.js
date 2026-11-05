require("dotenv").config();
 
const app = require("./app");

const PORT = process.env.PORT || 5000;


const startServer = async () => {
    try {
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }   
};

startServer();
        