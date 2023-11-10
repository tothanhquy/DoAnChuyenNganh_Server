var createError = require('http-errors');
var express = require('express');
const fileUpload = require('express-fileupload');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MainSocket = require('./controllers/Socket/MainSocket');

var mongoose  = require('./models/ConnectDatabase');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.set('view engine', 'ejs');
app.set('layout', './layouts/layout_admin')

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static',express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.use(session({
  secret: "maddfgdj4gh1fdh41s48fdf4",  // a secret key used to sign the session ID cookie
  resave: false,  // don't save the session if it hasn't changed
  saveUninitialized: true  // save new sessions that haven't been modified
}));

//socket.io
var server = require("http").Server(app);
var socketio = require("socket.io")(server);

socketio.on("connection", (socket)=>{
  MainSocket.MainSocket(socketio, socket);
});

app.use(function(req, res, next) {
  req.io = socketio;
  req.lang = req.cookies.lang || 'vi';
  next();
});


var indexRouter = require('./routes/index');
// app.use('/', indexRouter);

var accountsRouter = require('./routes/AccountRouter');
app.use('/Account', accountsRouter);

var adminRouter = require('./routes/AdminRouter');
app.use('/Admin', adminRouter);

var skillsRouter = require('./routes/SkillRouter');
app.use('/Skill', skillsRouter);

var userProfileRouter = require('./routes/UserProfileRouter');
app.use('/UserProfile', userProfileRouter);

var teamProfileRouter = require('./routes/TeamProfileRouter');
app.use('/TeamProfile', teamProfileRouter);

var requestRouter = require('./routes/RequestRouter');
app.use('/Request', requestRouter);

var postRouter = require('./routes/PostRouter');
app.use('/Post', postRouter);

var friendRouter = require('./routes/FriendRouter');
app.use('/Friend', friendRouter);

var chanelChatRouter = require('./routes/ChanelChatRouter');
app.use('/ChanelChat', chanelChatRouter);

var messageRouter = require('./routes/MessageRouter');
app.use('/Message', messageRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.locals.layout = './layouts/layout_user';
  res.render('error', { title: 'Error'});
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
