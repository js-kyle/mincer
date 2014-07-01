#= require jquery/jquery
#= require bootstrap/js/bootstrap-modal
#= require_tree ./templates

$ ->
  $dialog = $ JST["templates/foobar"]()


  console.log('$$ JSON.stringify(asset_path("app.css")) $$')


  $("h1").click ->
    $dialog.modal()

