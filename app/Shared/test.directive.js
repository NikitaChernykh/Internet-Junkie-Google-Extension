module.exports = function(dataService) {
  return{
      link: function (scope,element,attrs,controller){
          dataService.getTopTen().then(function(result){
            scope.topTenYesterdays = result;
        });
      }
    };
};
