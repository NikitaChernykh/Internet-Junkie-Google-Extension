module.exports = function(dataService) {
  return{
      link: function (scope,element,attrs,controller){
          dataService.getTopTen().then(function(result){
            console.log(result);
            //todo serch for days and assing them to lists to dipaly
            scope.topTenYesterdays = result[0].websiteList;

            scope.topTenBeforeYesterdays = result[1].websiteList;
        });
      }
    };
};
