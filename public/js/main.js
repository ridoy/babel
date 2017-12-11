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
    .then(populateAnnotationColumn);

  function populateAnnotationColumn() {
    app.annotations.load({uri: window.location.href}).then(function() {
      app.annotations.store.query().then(function(data) {
        var originalAnnotations = data.results;
        setTimeout(function() {
          var annotations = {};
          // Group annotations by paragraph
          for (var annotation of originalAnnotations) {
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
            $('.marginalia').append('<div class="marginalia__annotation-group" data-selector="' + selector + '">');
            $('div[data-selector="' + selector + '"]').css({'position': 'absolute', 'top': top});
            for (var annotation of paragraph) {
              if (!annotation.isReplyToId) { // If annotation is not a reply
                var maxQuoteLength = 40;
                if (annotation.quote.length > maxQuoteLength) {
                  var trimmedQuote = '<b>"' + annotation.quote.substring(0, maxQuoteLength) + '...":</b>'
                } else {
                  var trimmedQuote = '<b>"' + annotation.quote + '":</b>'
                }
                var replies = $.grep(originalAnnotations, function(e) { return e.isReplyToId == annotation.id } );
                var numReplies = replies.length;
                if (numReplies > 0) {
                  var viewRepliesElement = '[<a href="javascript:void(0)" data-toggle="modal" data-target="#modal--view-replies" '
                                           + 'class="marginalia__view-replies">View ' + numReplies + ' Replies</a>]';
                } else {
                  var viewRepliesElement = '<span>[No replies yet]</span>';
                }
                var comment = '<span>' + trimmedQuote + '<br>' + '<span style="margin-left: 20px; display: block;">' + annotation.text + '</span></span>'
                              + '<div class="marginalia__action-area" data-annotation-id="' + annotation.id + '">'
                              + '[<a href="javascript:void(0)" class="inactive marginalia__open-reply-box">Reply to this</a>]'
                              + viewRepliesElement
                              + '</div>'
                $('div[data-selector="' + selector + '"]').append(comment);
              }
            }
          }

          // Submit reply to server
          $('.marginalia__open-reply-box').on('click', function() {
            if ($(this).hasClass('inactive')) { 
              // Close reply box
              $(this).before('<textarea class="marginalia__reply-box" placeholder=""></textarea><button class="marginalia__submit-reply">Submit Reply</button>');
              attachSubmitListener($(this).parent().children('.marginalia__submit-reply')[0],
                                   $(this).parent().children('.marginalia__reply-box')[0]);
              $(this).removeClass('inactive').addClass('active');
              $(this).text('Cancel');
            } else if ($(this).hasClass('active')) { 
              // Open reply box
              $(this).parent().children('.marginalia__reply-box').remove();
              $(this).parent().children('.marginalia__submit-reply').remove();
              $(this).removeClass('active').addClass('inactive').text('Reply to this');
            } else {
              $(this).addClass('inactive');
            }
          });

          function attachSubmitListener(submitReplyElement, replyBoxElement) {
            var isReplyToId = $(submitReplyElement).parent().attr('data-annotation-id');
            var isReplyToAnnotation = $.grep(originalAnnotations, function(e) { return e.id == isReplyToId })[0];
            $(submitReplyElement).on('click', function() {
              var replyText = $(replyBoxElement).val();
              $.ajax({
                method: 'POST',
                url: '/store/annotations',
                contentType: 'application/json',
                data: JSON.stringify({
                  text: replyText,
                  isReplyToId: isReplyToId,
                  quote: isReplyToAnnotation.quote,
                  ranges: isReplyToAnnotation.ranges
                }),
                success: function() {
                  window.location.reload();
                }
              });
            });
          }

          // Hover over annotaiton container to bring to front
          $('.marginalia__annotation-group').on('mouseover', function() {
            $(this).css({'z-index':'2'});
          });
          $('.marginalia__annotation-group').on('mouseout', function() {
            $(this).css({'z-index':'1'});
          });

          // View replies
          $('.marginalia__view-replies').on('click', function() {
            var rootAnnotationId = $(this).parent().attr('data-annotation-id');
            var rootAnnotation   = $.grep(originalAnnotations, function(e) { return e.id == rootAnnotationId })[0];
            var replies = $.grep(originalAnnotations, function(e) { return e.isReplyToId == rootAnnotationId } );

            replies = replies.sort(function(a, b) {
              return a.timestamp - b.timestamp;
            });

            $('.modal-body').empty();
            var modalContentContainer = '<div class="row">';
            var rootAnnotationElement = '<div class="col-xs-4"><h4><b>Quote</b></h4><span style="color: #777;"><i>"' + rootAnnotation.quote + '"</i></span></div>'
            var repliesElement = '<div class="col-xs-8">';
            repliesElement += '<h4><b>Annotations</b></h4>'
                              + '<span style="color: #777;">Original annotation:</span><br><br><span style="margin-left: 20px; display: block;">' + rootAnnotation.text  + '</span><br>';
            for (var reply of replies) {
              repliesElement += '<span style="color: #777;">' + formatDate(new Date(reply.timestamp)) + ':</span><br><br><span style="margin-left: 20px; display: block;">' + reply.text + '</span><br>'
            }
            repliesElement += '</div>';
            modalContentContainer += rootAnnotationElement + repliesElement + '</div>';
            $('.modal-body').append(modalContentContainer);
          });
        }, 500);
      });
    });
  }

  var navToolHidden = false;

  $('.nav-sidebar-toggle').on('click', function() {
    var classesSelector = '.nav-sidebar-button-group, .nav-sidebar > span';
    if (navToolHidden) {
      $(classesSelector).hide();
      $('.nav-sidebar-toggle').text('[ OPEN THIS ]');
    } else {
      $(classesSelector).show();
      $('.nav-sidebar-toggle').text('[ CLOSE THIS ]');
    }
    navToolHidden = !navToolHidden;
  });

  function formatDate(date) {
    var dateString =
        ("0" + date.getUTCHours()).slice(-2) + ":" +
        ("0" + date.getUTCMinutes()).slice(-2) + ":" +
        ("0" + date.getUTCSeconds()).slice(-2);
    var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();

    return monthNames[monthIndex] + ' ' + day + ' at ' + dateString;

    return dateString;
  }


});
