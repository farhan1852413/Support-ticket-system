const bcrypt = require("bcrypt");

bcrypt.hash("newpassword123", 10).then(console.log);