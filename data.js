/* Tiedoston käsittelyä */
const filename = 'data_1.csv';
const dayjs = require('dayjs');
const csv = require('csv-parser');
const fs = require('fs');

//opetusdata = data jota saatavilla
let traindata = {};
//alustava data, joka saatu csv:na
//let arrTrain = [];
//lopullinen traindata array
let arrTrainData = [];

/** Tekee kahdesta taulukosta (otsakkeet, arvot)
 * yhden taulukon jossa JavaScript objecteja
 * tehty omiin tarpeisiin sopivaksi */

function twoToOneJsonArray(arrayHeaders, arrayValues) {
    i = 0;
    const myObject = arrayHeaders.reduce((accumulator, value) => {
        accumulator[value] = arrayValues[i];
        //luodaan objekti
        i++;
        return accumulator;
    }, {});

    return myObject;
}

/** Poistaa csv:stä saadusta datasta ylimääräiset merkit ja palauttaa taulukon
 * Näin saadaan dataa joista tehdään traindataa
 */
function jsonToarray(line) {
    let headers6 = [];
    let req = /("{\\)/;
    let first = JSON.stringify(line.split(';')).replace(req, '');
    //console.log(" he" + first);

    let req2 = /(\\")/;
    headers = first.replace(req2, '');

    let req3 = /(\\"})/
    headers2 = headers.replace(req3, '');

    let req4 = /(\[)/;
    headers3 = headers2.replace(req4, '');

    let req5 = /(\])/;
    headers4 = headers3.replace(req5, '');

    let req6 = /(")/gi;//kaikki
    headers5 = headers4.replace(req6, '');

    //split tekee taulukon
    headers6 = headers5.split(',');
    return headers6;
}

/** Luo csv:sta taulukon jossa jsonobjekteja */
//async function csvToJsonArray() { 
const promise = new Promise((resolve) => {
    let arrayHeaders = [];
    let arrayValues = [];
    let arrTrain = [];

    fs.createReadStream(filename)
        .pipe(csv())
        .on('data', (row) => {
            //console.log(row);
            //{ 'date;item_id;amount': '2013-01-15;8555;1' }
            let line = JSON.stringify(row).split(":");
            let headers = [];
            headers = jsonToarray(line[0]);
            let values = [];
            values = jsonToarray(line[1]);
            traindata = twoToOneJsonArray(headers, values);
            arrTrain.push(traindata);
        })
        .on('end', () => {

            doTrainData(arrTrain);
            //doYData();

            console.log('CSV file successfully processed');
            resolve();
        })
    /* .on('close', () => {
         console.log('Stream has been destroyed and file has been closed');
     });*/

});

/** TEKEE filuun sisältämään tietoon
 * weekName sarakkeen, tämä on siis oikeasti lopullista
 * OPETUSDATAA
 */
function doTrainData(arrTrain) {
    //lisätään viikonnumero 1-52 sekä "kauden"(noin kuukausi, 4 viikon jakso) numero
    let weeksNumber = [];

    for (let i = 0; i < arrTrain.length; i++) {
        const row = arrTrain[i]; //javascript object
        //luodaan päivästä YY,MM,DD
        let d = weekDate(row.date);
        //hakee viikkonumeron ja nimen
        //täytyy lisätä kuukauteen yksi koska new date kuukausi alkaa 0
        weeksNumber = getWeeksNumbers(d.getFullYear(), d.getMonth() + 1, d.getDate());

        //lisätään taulukkoon
        arrTrainData.push({
            weekName: weeksNumber[0],
            // date: row.date,
            item_id: row.item_id,
            amount: row.amount
        })
    };

}

/** yTrue void tekee taulukon*/
function doYData() {
    //Tehdään taulukko arvoista
    arrTrainData.forEach(element => {
        arrY.push({
            weekName: element.weekName,
            amount: element.amount
        });
    });
    //console.log("Luotu " + arrY.length + " alkiota.");
}

/**  Hajottaa päivämäärän taulukoksi
*/
function weekDate(date) {
    //taulukko weeklist
    let week = [];
    let YY = 0;
    let MM = 0;
    let DD = 0;
    const day = date.split('-');
    //hajotetaan osiksi
    for (i = 0; i < day.length; i++) {
        YY = day[0];
        MM = day[1] - 1; //kuukausi alkaa 0
        DD = day[2];
    }

    let d = new Date(YY, MM, DD);
    //console.log("DATE " + YY);
    return d;
}

/** hakee taulukkoon viikonnumeron(1-52) 
 * ja nimen 
 * (= onko kuukauden 1,2,3,4 vaiko vaillinainen viikko eli kuukausi vaihtuu kesken viikon, jolloin numero 0 ) päivämäärän mukaan */
function getWeeksNumbers(YY, MM, DD) {
    //halutut arvot tähän viikkonumero ja kauden numero
    let weeksNumber = [];
    let finded = false;

    let targetDate = dayjs(`${YY}-${MM}-${DD}`).format('YYYY-MM-DD');
    //haetaan viikko
    let targetWeek = getWeek(targetDate);
    console.log("TARGETWEEK " + targetWeek);
    //haetaan viikolista
    week = getWeekMonth(YY, MM, DD);

    //console.log("WIIKKO " + JSON.stringify(week));
    week.forEach(element => {
        //jos halutun pvm viikko kyseessä
        if (element.num == targetWeek) {
            weeksNumber.push(
                parseInt(element.weekName),
                element.num
            );
            // console.log("Päivä joka löytyi " + targetDate);
            finded = true;
            //return weeksNumber;
        }
    });
    // jos ei löytynyt on kyseessä sellainen alkuviikko, joka ei näy,
    // koska on ehkä edellisen kuukauden puolella
    // laitetaan 0:seksi viikoksi
    // TO DO TUTKI onko viimeinen viikko vielä tätä kuuta
    if (!finded) {
        weeksNumber.push(
            1,
            targetWeek
        );

    }
    return weeksNumber;
}

/** Lähde:  https://gist.github.com/dblock/1081513*/
function getWeek(date) {

    // Create a copy of this date object  
    var target = new Date(date.valueOf());

    // ISO week date weeks start on monday, so correct the day number  
    var dayNr = (target.getDay() + 6) % 7;

    // Set the target to the thursday of this week so the  
    // target date is in the right year  
    target.setDate(target.getDate() - dayNr + 3);

    // ISO 8601 states that week 1 is the week with january 4th in it  
    var jan4 = new Date(target.getFullYear(), 0, 4);

    // Number of days between target date and january 4th  
    var dayDiff = (target - jan4) / 86400000;

    if (new Date(target.getFullYear(), 0, 1).getDay() < 5) {
        // Calculate week number: Week 1 (january 4th) plus the    
        // number of weeks between target date and january 4th    
        return 1 + Math.ceil(dayDiff / 7);
    }
    else {  // jan 4th is on the next week (so next week is week 1)
        return Math.ceil(dayDiff / 7);
    }
};

/** Saa päivän ja palauttaa viikkolistan, jossa
 * viikon alkupäivä ma ja su loppupäivä, viikonnumero 1-52, 
 * sekä viikkonumero sen mukaan monesko "alkio" kyseessä
 * HUOM! Aloittaa ensimmäisestä KOKONAISESTA VIIKOSTA
 *  lähde: https://gist.github.com/markthiessen/3883242 */
const getWeekMonth = (year, month, day) => {
    let date = new Date(year, month, day);

    //targetdate, haluttu pvm
    let targetDate = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD');
    console.log("TARGET " + targetDate);
    //asetetaan päivä jonka lista halutaan 
    let target = getWeek(targetDate);

    //LÄHDE tästä eteenpäin
    const firstDay = dayjs(`${year}-${month}`).startOf('month').format('d');

    let startDay;
    if (firstDay === 1) {
        startDay = dayjs(`${year}-${month}`).format('YYYY-MM-DD');
    } else {
        const diffDays = (8 - firstDay) % 7
        startDay = dayjs(`${year}-${month}`).startOf('month').add(diffDays, 'days').format('YYYY-MM-DD')
    }

    const lastDay = dayjs(`${year}-${month}`).endOf('month').format('d');

    let endDay;
    if (lastDay === 0) {
        endDay = dayjs(`${year}-${month}`).endOf('month').format('YYYY-MM-DD')
    } else {
        const lastDiffDays = 6 - lastDay
        endDay = dayjs(`${year}-${month}`).startOf('month').add(1, 'month').add(lastDiffDays, 'days').format('YYYY-MM-DD');
    }

    const weeks = (dayjs(endDay).diff(dayjs(startDay), 'days') + 1) / 7;

    const weekList = []
    for (let i = 1; i <= weeks; i++) {
        weekList.push({
            weekName: `${i}`,
            //wiikon numero
            num: getWeek(startDay),
            startDay,
            endDay: dayjs(startDay).add(6, 'days').format('YYYY-MM-DD'),
            range: `${dayjs(startDay).format('MM-DD')}~${dayjs(startDay).add(6, 'days').format('MM-DD')}`
        })
        startDay = dayjs(startDay).add(7, 'days').format('YYYY-MM-DD');

        //käydään hakemassa haluttu päivä
        let d = weekDate(startDay);
    }
    console.log("RANGE " + JSON.stringify(weekList));
    return weekList;
}
/** Hakee tiedot tietokannasta ja luo niistä 
 * testidatan eli datan jolle halutaan arvoja.
 * Käytetään randomForestissa
*/
/*const promiseDatabase = new Promise((resolve) => {
    Data.find().then((datas) => {
        //console.log("dataa " + datas);
        for (i = 0; i < datas.length; i++) {
            arrTest.push({
                _id: datas[i]._id,
                item_id: datas[i].item_id,
                name: datas[i].name,
                date: datas[i].date,
                amount: datas[i].amount
            })
        }

    }).catch((err) => {
        console.error(err);
    });

    return arrTest;
})*/

/** alustaa datan, lukee csv:n sekä databasen */
const run = async () => {

    //käsketään odottaa, että luo arrayt
    await promise;
    //await promiseDatabase;

};

module.exports = { run };