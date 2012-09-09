//= require jquery
//= require bootstrap-modal
//= require_tree ./templates

$(function () {
  var $dialog = $( JST['templates/foobar']() );
  $('h1').click(function () {
    $dialog.modal();
  });
});
