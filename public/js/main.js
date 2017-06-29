/*

    var content = $('body').annotator('setupPlugins', {}, {
                    //Disable the tags plugin
                    Tags: false,
                    // Filter plugin options
                    Filter: {
                      addAnnotationFilter: false, // Turn off default annotation filter
                      filters: [{label: 'Quote', property: 'quote'}] // Add a quote filter
                    }
                  });
    // Set up store plugin
    content.annotator('addPlugin', 'Store', {
      // The endpoint of the store on your server.
      prefix: '/store',

      // Attach the uri of the current page to all annotations to allow search.
        // TODO delete
      annotationData: {
        'uri': 'http://this/document/only'
      },

      // This will perform a "search" action when the plugin loads. Will
      // request the last 20 annotations for the current url.
      // eg. /store/endpoint/search?limit=20&uri=http://this/document/only
      loadFromSearch: {
        'limit': 1000
      }
    });
    */

var app;

$(document).ready(function() {
  app = new annotator.App();
  app.include(annotator.ui.main, {element: $('.inner')[0]});
  app.include(annotator.storage.http, {prefix: '/store'});
  app.start()
    .then(function() {
      app.annotations.load({uri: window.location.href}).then(function() {
        var annotations = [];
        app.annotations.store.query().then(function(data) {
          setTimeout(function() {
            var annotations = {};
            for (var annotation of data.results) {
              if (annotations[annotation.ranges[0].start]) {
                annotations[annotation.ranges[0].start].push(annotation);
              } else {
                annotations[annotation.ranges[0].start] = [ annotation ];
              }
            }
            for (var selector in annotations) {
              annotations[selector] = annotations[selector].sort(function(a, b) {
                return a.ranges[0].startOffset - b.ranges[0].startOffset;
              });
            }
            for (var selector in annotations) {
              var paragraph = annotations[selector]
              var top = $('span[data-annotation-id="' + paragraph[0].id + '"]').parent().position().top;
              $('.marginalia-container').append('<div data-selector="' + selector + '">');
              $('div[data-selector="' + selector + '"]').css({'position': 'absolute', 'top': top});
              for (var annotation of paragraph) {
                var maxQuoteLength = 40;
                if (annotation.quote.length > maxQuoteLength) {
                  var trimmedQuote = '<b>"' + annotation.quote.substring(0, maxQuoteLength) + '...":</b><br>'
                } else {
                  var trimmedQuote = '<b>"' + annotation.quote + '":</b><br>'
                }

                $('div[data-selector="' + selector + '"]').append('<span>' + trimmedQuote + annotation.text + '</span><br>');
              }
            }
            /*
            annotations.map(function(annotation) {
              var highlight = $('span[data-annotation-id="' + annotation.id + '"]');
              console.log(highlight);
              if (highlight.position()) {
                var top = highlight.position().top;
                $('.marginalia-container').append('<div data-id="' + annotation.id + '">' + annotation.text + '</div>');
                $('div[data-id="' + annotation.id + '"]').css({'position': 'absolute', 'top': top});
              }
            });
            */
          }, 500);
        });
      });
    });

  var navToolHidden = false;

  $('.nav-sidebar-toggle').on('click', function() {
    var classesSelector = '.nav-sidebar-button-group, .nav-sidebar > span';
    if (navToolHidden) {
      $(classesSelector).hide();
      $('.nav-sidebar-toggle').text('[ SHOW NAV BAR ]');
    } else {
      $(classesSelector).show();
      $('.nav-sidebar-toggle').text('[ X ]');
    }
    navToolHidden = !navToolHidden;
  });

  // Display marginalia

});
