module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          console.log(attrs);
          scope.myClass = "dayCircle";
          if(attrs.name == scope.today.number){
            console.log('true once');
            scope.myClass = "day-circle-today";
          }

          element.on('click', function(event){
              if(attrs.name != scope.today.number){
                 scope.myClass += " activeDay";
              }

              //_gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);

          });
      }
  };
};
