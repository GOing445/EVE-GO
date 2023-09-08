module.exports.SecToHHMMSS = function () {
    var sec_num = parseInt(Sec, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+'시간'+minutes+'분'+seconds+'초';
    return time;
}
module.exports.SecToDDHHMMSS = function (Sec) {
    var sec_num = parseInt(Sec, 10); // don't forget the second param
    var days = Math.floor(sec_num / 86400);
    var hours   = Math.floor((sec_num - (days * 86400)) / 3600);
    var minutes = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
    var seconds = sec_num - (days * 86400) - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = days + "일" + hours+'시간'+minutes+'분'+seconds+'초';
    return time;
}
module.exports.TimemCal = function(CCPdate) {
    var date = CCPdate.split("T")[0];
    var time = CCPdate.split("T")[1];
    
    console.log(date,time);
}
    var now = moment(new Date()); //todays date
    var end = "2018-12-11T04:24:31Z"

    var duration = moment.duration(now.diff(end));

    console.log(duration);

    var date = CCPdate.split("T")[0].split("-");
    var time = CCPdate.split("T")[1].split("Z")[0].split(":");
    
    var sec = time[2] + (time[1]*60) + (time[0]*3600) + (date[3]*86400) +

    console.log(date,time);

    // 두개의 날짜를 비교하여 차이를 알려준다.
function dateDiff(_date1, _date2) {
    var diffDate_1 = _date1 instanceof Date ? _date1 : new Date(_date1);
    var diffDate_2 = _date2 instanceof Date ? _date2 : new Date(_date2);
    console.log(diffDate_1);
    console.log(diffDate_2);

    //diffDate_1 = new Date(diffDate_1.getFullYear(), diffDate_1.getMonth()+1, diffDate_1.getDate());
    //diffDate_2 = new Date(diffDate_2.getFullYear(), diffDate_2.getMonth()+1, diffDate_2.getDate());
    //console.log(diffDate_1);
    //console.log(diffDate_2);

    var diff = Math.abs(diffDate_2.getTime() - diffDate_1.getTime());
    diff = Math.ceil(diff / (1000 * 3600 * 24));
 
    return diff;
}
 
var a = "2019-05-15T20:02:29Z";
 
console.log('a는 오늘로 부터 ' + dateDiff(a, new Date()) + ' 전입니다.');
console.log(new Date());

