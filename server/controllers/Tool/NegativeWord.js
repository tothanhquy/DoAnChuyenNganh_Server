const negativeWords = ['buồi','caidaubuoi','nhucaidaubuoi','dauboi','caidauboi','đầu bòy','đầu bùi','caidauboy','cặc','cak','concak','nungcak','bucak','caiconcac','caiconcak','cặk','địt mẹ','địt mịe','địt má','địt mía','địt ba','địt bà','địt cha','địt','địt con','địt bố','địt cụ','ditmemayconcho','ditmemay','ditmethangoccho','ditmeconcho','dmconcho','ditmecondi','ditmecondicho','đụ','đụ mẹ','đụ mịa','đụ mịe','đụ má','đụ cha','đụ bà','đú cha','đú con mẹ','đú má','đú mẹ','đù cha','đù má','đù mẹ','đù mịe','đù mịa','đậu mẹ','đậu má','đĩ','di~','đuỹ','điếm','cđĩ','cdi~','đilol','điloz','đilon','diloz','dilol','dilon','condi','condi~','dime','di me','dimemay','condime','condimay','condimemay','condicho','bitch','lồn','lìn','matlon','cailon','matlol','matloz','thangmatlon','thangml','đỗn lì','xàm lol','xam lol','xạo lol','xao lol','con lol','ăn lol','an lol','mát lol','mat lol','cái lol','cai lol','lòi lol','ham lol','củ lol','cu lol','ngu lol','tuổi lol','mõm lol','mồm lol','mom lol','như lol','nứng lol','nung lol','nug lol','nuglol','rảnh lol','ranh lol','đách lol','dach lol','mu lol','banh lol','tét lol','tet lol','vạch lol','vach lol','cào lol','cao lol','tung lol','mặt lol','mát lol','mat lol','xàm lon','xạo lon','nứng lon','rảnh lon','cái lờ','vailon','nốn lừng','chịch','vãi','đụ','nứng','đút đít','banh háng','xéo háng','xoạc','fuck','buscu','óc chó','láo chó','chó má','cờ hó','sảng','thằng chó','chó điên','mẹ cha nhà mày','mả cha mày','mả cha nhà mày','bà cha mày','cmn','cmnl','tiên sư nhà mày','tiên sư bố','sex','porn','xnxx'];

module.exports.filterString = function(str){
    if(str=="")return "";
    let resStr=str;
    let lowercaseStr=str.toLowerCase();
    let isExist;
    negativeWords.forEach(e=>{
        while(true){
            isExist=false;
            let indexWord = lowercaseStr.indexOf(e);
            if(indexWord!=-1){
                isExist=true;
                resStr=replaceWord(str,indexWord,e.length);
                lowercaseStr=replaceWord(lowercaseStr,indexWord,e.length);
            }
            if(isExist==false)break;
        }
    });
   
    return resStr;
}
const replaceWord=function(str,index,length){
    try{
        let resStr="";
        for(let i = 0;i<length;i++){
            if(i%3==0){
                resStr+=str.charAt(index+i);
            }else{
                resStr+='*';
            }
        }
        return resStr;
    }catch(err){
        return "";
    }
}
