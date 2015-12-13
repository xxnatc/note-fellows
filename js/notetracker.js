var noteTracker = {};
noteTracker.currUser = localStorage.getItem('user');

noteTracker.init = function() {
  webDB.init();
  if (!localStorage.getItem('noteCache')) {
    this.loadData();
    localStorage.setItem('noteCache', true);
  } else {
    noteTracker.showPreviewAll();
  }
};

noteTracker.loadData = function() {
  webDB.execute('DELETE FROM notes;');
  $.getJSON('data/notes.json', function(data) {
    data.forEach(function(el) {
      noteTracker.writeToDB(el);
    });
  }).done(function() {
    noteTracker.showPreviewAll();
  });
};

noteTracker.writeToDB = function(note) {
  webDB.execute(
    [{
      'sql': 'INSERT INTO notes (title, user, tags, content) VALUES (?, ?, ?, ?);',
      'data': [note.title, note.user, note.tags, note.content]
    }]
  );
};

noteTracker.showPreviewAll = function(callback) {
  callback = callback || function() {};
  $('#noteList').empty();
  webDB.execute(
    [{
      'sql': 'SELECT * FROM notes WHERE user = ?',
      'data': [noteTracker.currUser]
    }],
    function(data) {
      data.forEach(noteTracker.appendPreview);
      callback();
    }
  );
};

noteTracker.appendPreview = function(el) {
  var $elList = $('<li>').attr('data-id', el.id);
  var $elTitle = $('<p>').text(el.title);
  var $elTag = $('<p>').text(el.tags);
  $('#noteList').append($elList.append($elTitle, $elTag));
};

noteTracker.handlePreview = function() {
  $('#noteList').on('click', 'li', function(event) {
    event.preventDefault();
    var noteId = $(this).data('id');
    console.log(noteId);
    noteTracker.displayNote(noteId);
  });
};

noteTracker.displayNote = function(noteId) {
  webDB.execute(
    [{
      'sql': 'SELECT * FROM notes WHERE id = ?;',
      'data': [noteId]
    }],
    function(data) {
      $('#displayWindow').html(noteTracker.displayTemplate(data[0]));
      noteTracker.handleDisplayOptions(noteId, data[0]);
    }
  );
};

noteTracker.handleDisplayOptions = function(noteId, noteData) {
  $('#note-edit-button').on('click', function(event) {
    event.preventDefault();
    noteTracker.editNote(noteId,noteData);
  });
  $('#note-delete-button').on('click', function(event) {
    event.preventDefault();
    noteTracker.deleteNote(noteId);
  });
  $('#note-new-button').on('click', function(event) {
    event.preventDefault();
    noteTracker.newNote();
  });
};

noteTracker.editNote = function(noteId, noteData) {
  noteData.formLegend = 'Edit Note';
  noteData.submitText = 'Update Note';
  $('#displayWindow').html(noteTracker.formTemplate(noteData));
  $('#form-submit').on('click', function(event) {
    event.preventDefault();
    noteTracker.saveEditNote(noteId, $(this));
  });
};

noteTracker.saveEditNote = function(noteId, $btn) {
  var title = $btn.siblings('[name=noteTitle]').val();
  var tags = $btn.siblings('[name=noteTag]').val();
  var content = $btn.siblings('[name=noteContent]').val();

  webDB.execute(
    [{
      'sql': 'UPDATE notes SET title = ?, tags = ?, content = ? WHERE id = ?;',
      'data': [title, tags, content, noteId]
    }],
    function() {
      noteTracker.displayNote(noteId);
      noteTracker.showPreviewAll();
    }
  );
};

noteTracker.deleteNote = function(noteId) {
  webDB.execute(
    [{
      'sql': 'DELETE FROM notes WHERE id = ?;',
      'data': [noteId]
    }],
    function() {
      $('#displayWindow').empty();
      noteTracker.showPreviewAll();
    }
  );
};

noteTracker.newNote = function() {
  var formData = {};
  formData.formLegend = 'Create New Note';
  formData.submitText = 'Create New Note';
  $('#displayWindow').html(noteTracker.formTemplate(formData));
  $('#form-submit').on('click', function(event) {
    event.preventDefault();
    noteTracker.saveNewNote($(this));
  });
};

noteTracker.saveNewNote = function($btn) {
  var title = $btn.siblings('[name=noteTitle]').val();
  var tags = $btn.siblings('[name=noteTag]').val();
  var content = $btn.siblings('[name=noteContent]').val();
  if (title || content) {
    if (!title) {
      title = 'Untitled';
    }
    webDB.execute(
      [{
        'sql': 'INSERT INTO notes (title, tags, content, user) VALUES (?, ?, ?, ?);',
        'data': [title, tags, content, noteTracker.currUser]
      }],
      function() {
        noteTracker.showPreviewAll(function() {
          $('#noteList li:last-child').trigger('click');
        });
      }
    );
  } else {
    alert('Your note is blank!');
  }
};

noteTracker.getFormTemplate = function() {
  $.get('templates/notesForm.handlebars', function(data) {
    noteTracker.formTemplate = Handlebars.compile(data);
  }).done(function() {
    noteTracker.getDisplayTemplate();
  });
};

noteTracker.getDisplayTemplate = function() {
  $.get('templates/notesDisplay.handlebars', function(data) {
    noteTracker.displayTemplate = Handlebars.compile(data);
  }).done(function() {
    noteTracker.newNote();
    noteTracker.handlePreview();
  });
};

noteTracker.init();
noteTracker.getFormTemplate();
