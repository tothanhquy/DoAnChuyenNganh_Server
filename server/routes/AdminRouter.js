var express = require('express');
var router = express.Router();
// const ModelUploadFile = require('../models/ModelUploadFile');
var Auth = require('../core/Auth');
var AdminController = require('../controllers/Admin/AdminController');
var AdminSkillsController = require('../controllers/Admin/AdminSkillsController');
var AdminUsersController = require('../controllers/Admin/AdminUsersController');
/* GET users listing. */
router.get('/',Auth.AuthenAdmin,AdminController.Dashboard);
router.get('/Skills',Auth.AuthenAdmin,AdminSkillsController.SkillList);
router.get('/Skills/Create',Auth.AuthenAdmin,AdminSkillsController.CreateGet);
router.post('/Skills/Create',Auth.AuthenAdmin,AdminSkillsController.CreatePost);
router.get('/Skills/Edit/:id',Auth.AuthenAdmin,AdminSkillsController.EditGet);
router.post('/Skills/Edit/:id',Auth.AuthenAdmin,AdminSkillsController.EditPost);

router.get('/Users',Auth.AuthenAdmin, AdminUsersController.UserList);
router.get('/Users/Edit/:id',Auth.AuthenAdmin,AdminUsersController.EditGet);
router.post('/Users/Edit/:id',Auth.AuthenAdmin,AdminUsersController.EditPost);

module.exports = router;
