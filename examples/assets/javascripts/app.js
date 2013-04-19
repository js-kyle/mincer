//= require jquery
//= require bootstrap-modal
//= require_tree ./templates
//= require ./test

$(function () {
  var $dialog = $( JST['templates/foobar']() );
  $('h1').click(function () {
    $dialog.modal();
  });
});
