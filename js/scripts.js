'use strict'
$(document).ready(function(){

    // ------------------------- Variables -------------------------------------- //
    const eu_list = [
        // EU 28:
        "AT", "Austria",
        "BE", "Belgium",
        "BG", "Bulgaria",
        "HR", "Croatia",
        "CY", "Cyprus",
        "CZ", "Czech Republic",
        "DK", "Denmark",
        "EE", "Estonia",
        "FI", "Finland",
        "FR", "France",
        "DE", "Germany",
        "GR", "Greece",
        "HU", "Hungary",
        "IE", "Ireland, Republic of (EIRE)",
        "IT", "Italy",
        "LV", "Latvia",
        "LT", "Lithuania",
        "LU", "Luxembourg",
        "MT", "Malta",
        "NL", "Netherlands",
        "PL", "Poland",
        "PT", "Portugal",
        "RO", "Romania",
        "SK", "Slovakia",
        "SI", "Slovenia",
        "ES", "Spain",
        "SE", "Sweden",
    ]

    const countriesMap = new Map();
    const cpiDataMap = new Map();
    const urlAPI = 'https://www.econdb.com/api/series/CPI';
    const colors = ['red', 'green', 'orange'];

    // ------------------------- Funciones -------------------------------------- //
    function getKeyByValue(object, search) {
        for (let [key, value] of object.entries()) {
            if (value == search) {
            return key;
            }
        } 
        return 'Not found';
    }

    function getValueByKey(object, search) {
        for (let [key, value] of object.entries()) {
            if (key == search) {
            return value;
            }
        } 
        return 'Not found';
    }


    function valuesToArray (values) {
        let arr = []
        for (let i of values){
            arr.push(i.value)
        }
        return arr;
    }

    function datesToArray (dates) {
        let arr = []
        for (let i of dates){
            arr.push(i.date)
        }
        return arr;
    }

    function getMonthlyDiff (values) {
        let arr = [];
        for (var i = 0; i < values.length - 1; i++) {
            let diff = (values[i+1].value - values[i].value) / values[i].value;
            let element = {};
            element.date = values[i+1].date;
            element.value = diff;
            arr.push(element);
        }
        return arr;
    }

    function roundTo(n, digits) {
        if (digits === undefined) {
            digits = 0;
        }
        var multiplicator = Math.pow(10, digits);
        n = parseFloat((n * multiplicator).toFixed(11));
        var test =(Math.round(n) / multiplicator);
        return +(test.toFixed(digits));
    }

    function findMin(arr) {
        return Math.min.apply(null, arr);
    }

    function findMax(arr) {
        return Math.max.apply(null, arr);
    }

    function ajaxRequest(urlInput){
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: 'GET',
                url: urlInput,
                async:false,
                success: function(response){
                    resolve(response);
                },
                beforeSend: function () {
                    $("#loading").show();
                },
                complete: function () {
                    $("#loading").hide();
                    $('main').css("visibility", "visible");
                },
                error: function(error){
                    reject(error);
                }
            })
        })
    } 

    function fetchDataFromAPI(){
        return new Promise(function(resolve, reject){
            for (let [code, country] of countriesMap) {
                let urlCountry = urlAPI + code + '/?format=json';
                ajaxRequest(urlCountry)
                    .then(function (data) {
                        let countryData = [];                        
                        for (let i in data.data.dates){
                            let elemento = {};
                            let date = new Date(data.data.dates[i]);
                            elemento.date = date.getMonth()+1+'/'+date.getFullYear();
                            elemento.value = data.data.values[i];
                            countryData.push(elemento);
                        };
                        cpiDataMap.set(code,getMonthlyDiff(countryData));
                        console.log(cpiDataMap);
                    })
                    .catch(function (err){
                        console.log(err);
                    })
            resolve(cpiDataMap);
            reject();
            }
        })
    }



    function populateTable (country, code, countryData){
        let table = $("#summary");
        let row = $('<tr>');
        let from = countryData[0].date;
        let to = countryData[countryData.length - 1].date;
        let min = findMin(valuesToArray(countryData));
        let max = findMax(valuesToArray(countryData));
        let average = valuesToArray(countryData).reduce((a, b) => a + b, 0) / countryData.length;
        row.append('<td>'+country+'</td>');
        row.append('<td>'+code+'</td>');
        row.append('<td>'+from+'</td>');
        row.append('<td>'+to+'</td>');
        row.append('<td>'+roundTo(min*100,2)+'</td>');
        row.append('<td>'+roundTo(max*100,2)+'</td>');
        row.append('<td>'+roundTo(average*100,2)+'</td>');
        row.append('<td><button type="button" class="plot btn btn-outline-success" value="'+code+'">Plot</button></td>');
        table.append(row);
    }

    //////////////////////////////// CHART.JS /////////////////////////////////////////////////////

    function createDataset (code, color) {
        let countryData = cpiDataMap.get(code);
        let dataset = {};
        //rellenar dataset
        dataset.label = getKeyByValue(countriesMap, code);; 
        dataset.data = valuesToArray(countryData);
        dataset.backgroundColor = 'white';
        dataset.borderColor = color;
        dataset.borderWidth = 1;
        return dataset;
    }

    function getData (code) {
        let countryData = cpiDataMap.get(code);
        let data = {};
        let datasets = [];
        let dataset = createDataset(code, colors[datasets.length]);
        datasets.push(dataset);
        data.labels = datesToArray(countryData);
        data.datasets = datasets;
        return data;
    }

    function plotData (data, title){
        //chart.js
        var ctx = document.getElementById('myChart').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                elements: {
                    point:{
                        radius: 0
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 24,
                            style: 'italic',
                            family: 'Helvetica Neue'
                        }
                    }
                }
            }
        });
        return myChart;
    }

    function removePlot (){
        $("canvas").remove();
        $("#dropdown-menu").remove();
        $("#plot").append('<canvas id="myChart"></canvas>');
        $("#summary").after('<form id="dropdown-menu"></form>');  
    }



    // ------------------------------ Main ------------------------------ //
    for (var i = 0; i < eu_list.length; i +=2) {
        countriesMap.set(eu_list[i],eu_list[i+1]);
    }

    fetchDataFromAPI()        
    .then(function (cpiDataMap) {
        for (let [code, country] of countriesMap) {
            let countryData = cpiDataMap.get(code);
            populateTable(country, code, countryData);
        }         
    })
    .then(function() {
        $(".plot").click(function() {
            removePlot();
            let code = this.getAttribute("value");        
            let data = getData(code);
            plotData(data,getValueByKey(countriesMap,code));
            scrollTo(0,document.body.scrollHeight);         
        })
    })
});
