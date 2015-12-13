var noteTracker = {};
noteTracker.currUser = localStorage.getItem('user');

// loads data from JSON only if the noteCache doesn't exist in local storage
noteTracker.init = function() {
  webDB.init();
  if (!localStorage.getItem('noteCache')) {
    this.loadData();
    localStorage.setItem('noteCache', true);
  } else {
    noteTracker.showPreviewAll();
  }
};

// import data from JSON
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

// save to SQL database one note at a time
noteTracker.writeToDB = function(note) {
  webDB.execute(
    [{
      'sql': 'INSERT INTO notes (title, user, tags, content) VALUES (?, ?, ?, ?);',
      'data': [note.title, note.user, note.tags, note.content]
    }]
  );
};

// update and list all notes in preview
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

noteTracker.showPreviewFiltered = function(selectedTag) {
  $('#noteList').empty();
  webDB.execute(
    [{
      'sql': 'SELECT * FROM notes WHERE user = ? AND tags = ?',
      'data': [noteTracker.currUser, selectedTag]
    }],
    function(data) {
      data.forEach(noteTracker.appendPreview);
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

// display a note with specified id
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

// event handlers for the buttons in note display mode
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

// fill form with saved content from database
noteTracker.editNote = function(noteId, noteData) {
  noteData.formLegend = 'Edit Note';
  noteData.submitText = 'Update Note';
  $('#displayWindow').html(noteTracker.formTemplate(noteData));
  $('#form-submit').on('click', function(event) {
    event.preventDefault();
    noteTracker.saveEditNote(noteId, $(this));
  });
};

// rewrite the existing note in database
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

// remove note with specified id from database
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

// empty form for creating new note
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

// save new note into database, also check for empty title or content
noteTracker.saveNewNote = function($btn) {
  var title = $btn.siblings('[name=noteTitle]').val();
  var tags = $btn.siblings('[name=noteTag]').val();
  var content = $btn.siblings('[name=noteContent]').val();
  if (title.length || content.length) {
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
    noteTracker.showTagFilter();
    noteTracker.handlePreview();
    $('#noteList img').hide();
  });
};

noteTracker.showTagFilter = function() {
  webDB.execute(
    [{
      'sql': 'SELECT DISTINCT tags FROM notes WHERE user = ?;',
      'data': [noteTracker.currUser]
    }],
    function(data) {
      data.forEach(noteTracker.populateTagFilter);
      noteTracker.handleTagFilter();
    }
  );
};

noteTracker.populateTagFilter = function(el) {
  var $opt = $('<option>').attr('name', el.tags).text(el.tags);
  $('#tags-dropdown').append($opt);
};

noteTracker.handleTagFilter = function() {
  $('#tags-dropdown').on('change', function(event) {
    var selectedTag = $(this).find('option:selected').val();
    if (selectedTag === 'all') {
      noteTracker.showPreviewAll();
    } else {
      noteTracker.showPreviewFiltered(selectedTag);
    }
  });
};


noteTracker.init();
noteTracker.getFormTemplate();
