module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          scope.myClass = "dayCircle";
          if(attrs.name == scope.today.number){
            scope.myClass = "day-circle-today";
          }

          element.on('click', function(event){
              scope.selectedElement = element;
              if(scope.selectedElement != element){
                unselected(element);
              }
              select(element);
              // scope.myClass = "dayCircle";
              // if(attrs.name == scope.today.number){
              //   scope.myClass = "day-circle-today";
              // }
              // //for yesteday
              // if(attrs.name == scope.days[5].number){
              //
              //    scope.myClass = toggle(scope.myClass);
              //
              // }
              // if(attrs.name == scope.days[4].number){
              //
              //    scope.myClass = toggle(scope.myClass);
              // }
              // if(attrs.name == scope.days[3].number){
              //    scope.myClass = toggle(scope.myClass);
              // }
              // if(attrs.name == scope.days[2].number){
              //    scope.myClass = toggle(scope.myClass);
              // }
              // if(attrs.name == scope.days[1].number){
              //    scope.myClass = toggle(scope.myClass);
              // }
              // if(attrs.name == scope.days[0].number){
              //    scope.myClass = toggle(scope.myClass);
              // }
              // //$scope.$emit('view', authService.view);
              // console.log(scope.dayBtn);
              // //_gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);

          });
          var selected;
          var unselected = function(element){
                element.removeClass('activeDay');
          };
          var select = function(element){
              if (selected){
                  unselect(selected);
              }
              selected = element;
              element.addClass('activeDay');
          };
      }
  };

};
