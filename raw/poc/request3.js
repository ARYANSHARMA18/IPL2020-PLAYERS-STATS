let request = require("request");
let ch = require("cheerio");
let fs = require("fs");
let path=require("path");
let xlsx=require("xlsx");
request("https://www.espncricinfo.com/series/_/id/8048/season/2020/indian-premier-league",
    MainMatchCb);
function MainMatchCb(err, res, html) {
    let Stoll = ch.load(html);
    let allmatchurl = Stoll("a[data-hover='View All Results']").attr("href");
        let furl = "https://www.espncricinfo.com" +allmatchurl;
        AllmatchPage(furl);
    }
    function AllmatchPage(furl){
        request(furl,getAMurl);
        function getAMurl(err,res,html)
        {
            let Stoll= ch.load(html);
            let allmatchurlelem=Stoll("a[data-hover='Scorecard']");
            for(let i=0;i<allmatchurlelem.length;i++)
            {
                let href=Stoll(allmatchurlelem[i]).attr("href");
                let furl="https://www.espncricinfo.com"+href;
                finddataofamatch(furl);
            }
        }
    }
function finddataofamatch(url) {
    request(url, whendataarrive);
    function whendataarrive(err, res, html) {
            let Stoll = ch.load(html);
            let tableElem = Stoll(".card.content-block.match-scorecard-table .Collapsible");
            console.log(tableElem.length);
            let count = 0;
            for (i = 0; i < tableElem.length; i++) {
                let teamname = Stoll(tableElem[i]).find("h5.header-title.label").text();
                let rowsofTeam = Stoll(tableElem[i]).find(".table.batsman").find("tbody tr");
                let teamArr= teamname.split("Innings");
                 teamname=teamArr[0].trim();
                console.log(teamname)
                for (let j = 0; j < rowsofTeam.length; j++) {
                    let rCol = Stoll(rowsofTeam[j]).find("td");
                    let isBatsManRow = Stoll(rCol[0]).hasClass("batsman-cell");
                    if (isBatsManRow == true) {
                        count++;
                        let pName = Stoll(rCol[0]).text().trim();
                        let runs = Stoll(rCol[2]).text().trim();
                        let balls = Stoll(rCol[3]).text().trim();
                        let fours = Stoll(rCol[5]).text().trim();
                        let sixes = Stoll(rCol[6]).text().trim();
                        let sr = Stoll(rCol[7]).text().trim();
                       // console.log(`Name:${pName} Runs:${runs} Balls:${balls} Fours:${fours} Sixes:${sixes} Sr:${sr}`);
                        processPlayer(teamname,pName,runs,balls,fours,sixes,sr);
                    }
                }
                count = 0;
                console.log("---------------------------------------");
                //processPlayer(teamname,pName,runs,balls,fours,sixes,sr);
            }
        }
    }
function processPlayer(team,name,runs,balls,fours,sixes,sr){
let dirPath=team;
let pMatchstats=
{
Team:team,
Name:name,
Runs:runs,
Balls:balls,
Fours:fours,
Sixes:sixes,
Sr:sr
}
    if(fs.existsSync(dirPath)){
//console.log("folder exists");
    }
    else{
fs.mkdirSync(dirPath);
//console.log("teamname folder created");
    }

   let playerFilePath=path.join(dirPath,name+".xlsx");
   let pData=[];
   if (fs.existsSync(playerFilePath))
   {
       pData=excelReader(playerFilePath,name);
       pData.push(pMatchstats);
   }
   else{
       console.log("File of Player",playerFilePath,"created");
       pData=[pMatchstats];
       }
       excelWriter(playerFilePath,pData,name);
}
function excelReader(filePath,name){
    if(!fs.existsSync(filePath)){
        return null;
    }
    else{
        let wt=xlsx.readFile(filePath);
        let excelData=wt.Sheets[name];
        let ans=xlsx.utils.sheet_to_json(excelData);
        return ans;
    }
}
function excelWriter(filePath,json,name){
    let newWB=xlsx.utils.book_new();
    let newWS=xlsx.utils.json_to_sheet(json);
    xlsx.utils.book_append_sheet(newWB,newWS,name);
    xlsx.writeFile(newWB,filePath);
}