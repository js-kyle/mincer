#= require jquery
#= require bootstrap-modal
#= require_tree ./templates

$ ->
  $dialog = $ JST["templates/foobar"]()

  $("h1").click ->
    $dialog.modal()
