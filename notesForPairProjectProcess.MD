Use jQuery for all DOM and event listener code.
  event listeners
  getElementById

Use templates wherever possible. Handlebars.
  log-in
  about
  note-form

Use mobile-first principles where you can.
  currently responsive

Make the site responsive, for mobile and desktop.
  make sure ALL pages are responsive

Persist any user-generated data and user selections.
  data loading/caching

Use AJAX to load any significant data sources. - Cache data where appropriate.
  make some shit up

***
# Class 10 assignment: Refactoring code base
_Melissa Giaime and Natalie Chow_

### Changes implemented
- added jQuery - replacing event handlers and DOM manipulation commands
- implemented Handlebars.js - using templates on login page and notes input
- improved on responsiveness
- organized CSS file according to SMACSS principles
- broke up `app.js` into smaller, more page-speciifc scripts
- introduced data import from JSON when necessary
- improved effectiveness data caching - utilizing both Local Storage and Web SQL database

### Room to improve
- by refactoring the code, we lost feature to attach multiple tags on each entry
- the UI can use more attention to details, but we didn't want to change the original design
