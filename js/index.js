var login = {};

login.retrieveData = function() {
  if (localStorage.loginCombo) {
    login.combo = JSON.parse(localStorage.getItem('loginCombo'));
  } else {
    $.getJSON('data/loginCombo.json', function(data) {
      localStorage.setItem('loginCombo', JSON.stringify(data));
      login.combo = data;
    });
  }
};

login.showForm = function() {
  $.get('templates/login.handlebars', function(data) {
    login.template = Handlebars.compile(data);
  }).done(function() {
    login.showNewUserForm();
  });
};

// by default, it shows the register new user form
login.showNewUserForm = function() {
  var userElement = {
    formId: 'newUser',
    userType: 'Create New User',
    submitText: 'Register',
    buttonValue: 'Switch to Login Page',
    buttonId: 'existingButton'
  };

  var compiledHTML = login.template(userElement);
  $('#loginForm').html(compiledHTML);

  $('#newUser button').on('click', function(event) {
    event.preventDefault();
    login.checkNewUserLogin($(this));
  });
  $('#existingButton').on('click', function(event) {
    login.showReturnUserForm();
  });
};

// returning user login in
login.showReturnUserForm = function() {
  var userElement = {
    formId: 'returnUser',
    userType: 'Returning User',
    submitText: 'Sign in',
    buttonValue: 'Create New User',
    buttonId: 'newButton'
  };

  var compiledHTML = login.template(userElement);
  $('#loginForm').html(compiledHTML);

  $('#returnUser button').on('click', function(event) {
    event.preventDefault();
    login.checkReturnUserLogin($(this));
  });
  $('#newButton').on('click', function(event) {
    login.showNewUserForm();
  });
};

login.checkNewUserLogin = function($btn) {
  var username = $btn.siblings('[name=usr]').val();
  var password = $btn.siblings('[name=pword]').val();

  // check empty fields
  if (!username.length || !password.length) {
    $('#msg').text('Please enter username and password');
  } else {
    var userExists = false;
    var checkUsernameExists = function(el) {
      if (username === el.username) {
        userExists = true;
      }
    };
    login.combo.forEach(checkUsernameExists);

    if (!userExists) {
      var newUser = {
        username: username,
        password: password
      }
      login.combo.push(newUser);
      // remembers current user for notes page
      localStorage.setItem('user', username);
      // store username/password combo
      localStorage.setItem('loginCombo', JSON.stringify(login.combo));
      // redirect to notes.html
      login.redirectTo('/notes.html');
    } else {
      $('#msg').text('Username taken');
    }
  }
}

login.checkReturnUserLogin = function($btn) {
  var username = $btn.siblings('[name=usr]').val();
  var password = $btn.siblings('[name=pword]').val();

  // check empty fields
  if (!username.length || !password.length) {
    $('#msg').text('Please enter username and password');
  } else {
    var userExists = false;
    var checkCorrectLogin = function(el, index) {
      if (username === el.username) {
        // username match
        userExists = true;
        if (password === el.password) {
          // password match - remembers current user for notes page
          localStorage.setItem('user', username);
          login.redirectTo('/notes.html');
        } else {
          // password mismatch - shows warning message
          $('#msg').text('Incorrect password');
        }
      }
    };
    login.combo.forEach(checkCorrectLogin);

    if (!userExists) {
      $('#msg').text('User does not exist');
    }
  }
}

login.redirectTo = function(path) {
  $(location).attr('pathname', path);
};

login.retrieveData();
login.showForm();
