var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('passportapp', ['users']);
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



//login page get
router.get('/login', function(req, res){
	res.render('login');
});

//register page get
router.get('/register', function(req, res){
	res.render('register');
});


//register post
router.post('/register', function(req, res){
	// Get Form Values
	var name     		= req.body.name;
	var email    		= req.body.email;
	var username 		= req.body.username;
	var password 		= req.body.password;
	var password2 		= req.body.password2;

	// Validation
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Please use a valid email address').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	// Check for errors
	var errors = req.validationErrors();

	if(errors){
		console.log('Form has errors...');
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			username:username,
			password: password,
			password2: password2
		});
	} else{
		console.log('Success');
		var newUser = {
			name: name,
			email: email,
			username:username,
			password: password,
		}

		bcrypt.genSalt(10, function(err, salt){
			bcrypt.hash(newUser.password, salt, function(err, hash){
				newUser.password = hash;

			db.users.insert(newUser, function(err, doc){
					if(err){
						res.send(err);
					} else{
						console.log('User Added...');

						//Success Message
						req.flash('succes', 'You are registered and can now log in');
					
						//Redirect after register
						res.location('/');
						res.redirect('/');
					}
				});
			});
		});



	}
});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
db.users.findOne({_id: mongojs.ObjectID(id)}, function(err, user){
	done(err, user);
	});
});



passport.use(new LocalStrategy(
	function(username, password, done){
		db.users.findOne({username: username}, function(err, user){
			if(err){
				return done(err);
			}
			if(!user){
				return done(null, false, {message: 'Incorrect username'});
			}

			bcrypt.compare(password, user.password, function(err, isMatch){
				if(err){
					return done(err);
				}
				if(isMatch){
					return done(null, user);
				}
				else{
					return done(null, false, {message: 'Incorrect password'});
				}
			});
		});
	}
	));


//Login - POST
router.post('/login', passport.authenticate('local', { successRedirect: '/',
													failureRedirect: '/users/login',
													failureFlash: 'Invalid Username or Password'}),
function(req, res){
	console.log('Auth Successful');
	res.redirect('/');
});

router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You have logged out');
	res.redirect('/users/login');
});


module.exports = router;