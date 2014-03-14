#= require jquery/jquery
#= require bootstrap/js/bootstrap-modal
#= require_tree ./templates

$ ->
  $dialog = $ JST["templates/foobar"]()

  $("h1").click ->
    $dialog.modal()
