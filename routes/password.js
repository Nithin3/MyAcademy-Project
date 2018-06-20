var express = require("express");
var router = express.Router();
var User = require("../models/user.js");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

router.get("/forgot",function(req, res) {
    res.render("forgot.ejs");
});

router.post("/forgot",function(req,res,next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20,function(err,buf){
                var token = buf.toString('hex');
                done(err,token);
            });
        },
        
        function(token, done){
            User.findOne({email:req.body.email}, function(err,user){
                if(!User){
                    req.flash("error","No account with that email adress exists");
                    return res.redirect("/forgot");
                }
                
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now()+ 3600000;
                
                user.save(function(err){
                    done(err,token,user);
                });
            });
        },
        
        function(token,user,done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth:{
                    user:"nithin.sagar3@gmail.com",
                    pass: process.env.PASSWORD_GMAIL
                }
            });
            
            var mailOptions = {
                to: user.email,
                from:"nithin.sagar3@gmail.com",
                subject:"MyAcademy app password reset",
                text: "Hi " + user.firstName + ",\n\n" +
              "We've received a request to reset your password. If you didn't make the request, just ignore this email. Otherwise, you can reset your password using this link:\n\n" +
              "https://" + "myacademy-devnithin.c9users.io" + "/reset/" + token + "\n\n" +
              "Thanks.\n"+
              "The MyAcademy Team\n"
      };
      // send the email
      smtpTransport.sendMail(mailOptions, err => {
        
        console.log("mail sent");
        req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
        done(err, "done");
      });
    }
  ], err => {
    if (err) return next(err);
    res.redirect("/forgot");
  });
});

// reset password ($gt -> selects those documents where the value is greater than)
router.get("/reset/:token", (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (err) throw err;
    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      res.redirect("/forgot");
    } else { res.render("reset.ejs", { token: req.params.token }) }
  });
});

// update password
router.post("/reset/:token", (req, res) => {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (err) throw err;
        if (!user) {
          req.flash("error", "Password reset token is invalid or has expired.");
          return res.redirect("back");
        }
        // check password and confirm password
        if (req.body.password === req.body.confirm) {
          // reset password using setPassword of passport-local-mongoose
          user.setPassword(req.body.password, err => {
            if (err) throw err;
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            
            user.save(err => {
              if (err) throw err;
              req.logIn(user, err => {
                done(err, user);
              });
            });
          });
        } else {
           
          req.flash("error", "Passwords do not match");
          return res.redirect("back");
        } 
      });
    },
    function(user, done) {
      let smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "nithin.sagar3@gmail.com",
          pass: process.env.PASSWORD_GMAIL
        }
      });
      let mailOptions = {
        from: "nithin.sagar3@gmail.com",
        to: user.email,
        subject: "Your YelpCamp Password has been changed",
        text: "Hi " + user.firstName + ",\n\n" +
              "This is a confirmation that the password for your account " + user.email + "  has just been changed.\n\n" +
              "Best,\n"+
              "The MyAcademy Team\n"
      };
      smtpTransport.sendMail(mailOptions, err => {
        if (err) throw err;
        req.flash("success", "Your password has been changed.");
        done(err);
      });
    },
  ], err => {
    if (err) throw err;
    res.redirect("/cricketcamps");
  });
});

module.exports = router;