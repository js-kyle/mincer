//= require jquery
//= require bootstrap-modal

$(function () {
  var $dialog = $( $('#modal-tpl').text() );
  $('h1').click(function () {
    $dialog.modal();
  });
});
