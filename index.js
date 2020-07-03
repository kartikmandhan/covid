//jshint esversion:6
AOS.init();
//global variables
const covidMapData = {};

window.onscroll = function() {
  let navbar =$(".navbar");
  if (document.documentElement.scrollTop >= 450) {
    navbar.removeClass("bg-dark");
  } else {
    navbar.addClass("bg-dark");
  }
};

function listcountries(data, selectBoxCountry) {

  data.Countries.forEach(function(country) {
    const countryName = country.Country.replace(/[()]/g, '');

    // create option using DOM
    const newOption = document.createElement('option');
    newOption.text = countryName;
    // and option value
    newOption.setAttribute('value', countryName);
    selectBoxCountry.add(newOption);
  });

}

function resetCanvas() {
  //this twolines reset canvas everytime we change the chart
  $('#myChart').remove(); // this is my <canvas> element
  $('#chart_container').append('<canvas id="myChart" height="380"></canvas>');
}
function chart(dates, confirmed, recovered, deaths, typeOfCase) {
  //this function is called thrice ,twice inside fetchChartData,
  // 1.when we initially change only country 2.when we change selectboxcasetype
  //3. when we change scale from 1 Month to begining
  var ctx = $('#myChart')[0].getContext('2d');

  var chartConfig = {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: "Number of " + typeOfCase + " Cases",
        data: confirmed,
        borderColor: '#d92027',
        backgroundColor: '#d92027',
        pointBackgroundColor: '#d92027',
        pointRadius: 2,
        pointHoverBorderColor: "#851de0",
        lineTension: 0.1,
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      //this decreases height of chart corresponding to decrease in width,if set to true.
      // Which makes chart too small on small sceens,hence set to false
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true

          }
        }]
      }

    }
  };
  if (typeOfCase === "Recovered") {
    // console.log("inside Recovered");
    chartConfig.data.datasets[0].data = recovered;
    chartConfig.data.datasets[0].borderColor = "green";
    chartConfig.data.datasets[0].pointBackgroundColor = "green";
    chartConfig.data.datasets[0].backgroundColor = 'green';
  } else if (typeOfCase === "Deceased") {
    // console.log("inside Deceased");
    chartConfig.data.datasets[0].data = deaths;
    chartConfig.data.datasets[0].borderColor = "#888888";
    chartConfig.data.datasets[0].pointBackgroundColor = "#888888";
    chartConfig.data.datasets[0].backgroundColor = "#888888";
  }

  var myChart = new Chart(ctx, chartConfig);

}


function reformatDate(dateStr) {
  dArr = dateStr.split("-"); // eg input "2010-01-20"
  return dArr[2] + "/" + dArr[1] + "/" + dArr[0].substring(2); //eg out: "20/01/10"
}

function fetchChartData(countrySelected) {

  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  fetch("https://api.covid19api.com/total/country/" + countrySelected, requestOptions)
    .then(response => response.text())
    .then(function(result) {
      const chartDataJSON = JSON.parse(result);
      // console.log(chartDataJSON);
      var dates = []; //we overwrite these arrays,hence vaar do not change into const
      var confirmed = [];
      var recovered = [];
      var deaths = [];
      chartDataJSON.forEach(function(record) {
        dates.push(reformatDate(record.Date.slice(0, 10))); //we need only yyyy-mm-dd whose length is 10
        confirmed.push(record.Confirmed);
        recovered.push(record.Recovered);
        deaths.push(record.Deaths);
      });
      var sliceDataArrayBy; //by default active button is 1 month but still we cannot set it to constant value,
      //Since when we change country after Begining is in active state ,then this fetchChartData gets called and
      //it picks up sliceDataArrayBy=-30 and plots data for 30 days only and button active is still kept begining
      //hence we implement this code below
      const activeButtonName = $("#btn-container .active")[0].value;
      if (activeButtonName === "Begining") {
        sliceDataArrayBy = 0;
      } else if (activeButtonName === "2 Weeks") {
        sliceDataArrayBy = -14;
      } else {
        sliceDataArrayBy = -31;
      }

      // Add active class to the current button (highlight it) and change chart's scale
      var btnContainer = $("#btn-container")[0];
      var btns = btnContainer.getElementsByClassName("btn");
      for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function() {
          //below code is only executed when we change active state from 1 month to begining or vice-versa
          //hence do not consider it repeated code
          const current = $("#btn-container .active")[0];
          current.className = current.className.replace(" active", "");
          this.className += " active";
          // console.log(this.value);
          const buttonMadeActive = this.value;

          if (buttonMadeActive === "Begining") {
            sliceDataArrayBy = 0;
          } else if (buttonMadeActive === "2 Weeks") {
            sliceDataArrayBy = -14;
          } else {
            sliceDataArrayBy = -31;
          }
          resetCanvas();
          chart(dates.slice(sliceDataArrayBy), confirmed.slice(sliceDataArrayBy), recovered.slice(sliceDataArrayBy), deaths.slice(sliceDataArrayBy), selectBoxCaseType.value);
        });
      }


      selectBoxCaseType = $("#case_type")[0];
      selectBoxCaseType.addEventListener("change", function() {
        if (countrySelected != "Global") {
          resetCanvas();
          chart(dates.slice(sliceDataArrayBy), confirmed.slice(sliceDataArrayBy), recovered.slice(sliceDataArrayBy), deaths.slice(sliceDataArrayBy), selectBoxCaseType.value);
        }

      });
      resetCanvas();
      chart(dates.slice(sliceDataArrayBy), confirmed.slice(sliceDataArrayBy), recovered.slice(sliceDataArrayBy), deaths.slice(sliceDataArrayBy), selectBoxCaseType.value);
      //this above function call is necessary to call chart function when only country is changed,not the type of case


    })
    .catch(function(err) {
      console.log("error", err);
    });

}

function updateCardsAndChart(data, selectBoxCountry) {
  let countrySelected = selectBoxCountry.value;
  // console.log(data.Global.TotalConfirmed);


  var dataArrayName = data.Global;
  if (countrySelected != "Global") {
    dataArrayName = data.Countries[selectBoxCountry.selectedIndex - 1];
    fetchChartData(countrySelected);
  }

  let tConfirmed = $(".total_conf")[0];
  tConfirmed.innerText = dataArrayName.TotalConfirmed;
  let tRecovered = $(".total_reco")[0];
  tRecovered.innerText = dataArrayName.TotalRecovered;
  let tDeceased = $(".total_dead")[0];
  tDeceased.innerText = dataArrayName.TotalDeaths;

  let nConfirmed = $(".new_conf")[0];
  nConfirmed.innerText = "+" + dataArrayName.NewConfirmed;
  let nRecovered = $(".new_reco")[0];
  nRecovered.innerText = "+" + dataArrayName.NewRecovered;
  let nDeceased = $(".new_dead")[0];
  nDeceased.innerText = "+" + dataArrayName.NewDeaths;
}
const requestOptions = {
  method: 'GET',
  redirect: 'follow'
};
fetch("https://api.covid19api.com/summary", requestOptions)
  .then(response => response.text())
  .then(function(result) {
    const dataJSON = JSON.parse(result);
    var sortedReverseDataJSON = JSON.parse(result);
    //fetching data for maps in the form of countrycode:total confirmed cases
    sortedReverseDataJSON = sortedReverseDataJSON.Countries.sort(function(a, b) {
      return b.TotalConfirmed - a.TotalConfirmed;
    });
    const top9 = sortedReverseDataJSON.slice(0, 9);
    // console.log(top9);
    var tableData = {};
    dataJSON.Countries.forEach(function(country) {
      covidMapData[country.CountryCode] = country.TotalConfirmed;

    });
    // console.log(covidMapData);
    selectBoxCountry = $("#country_select")[0];
    listcountries(dataJSON, selectBoxCountry);
    updateCardsAndChart(dataJSON, selectBoxCountry);
    initialiseTable(top9);
    selectBoxCountry.addEventListener("change", function() {
      updateCardsAndChart(dataJSON, selectBoxCountry);


    });
  })
  .catch(function(err) {
    console.log("error", err);
  });

function initialiseTable(top9) {
  var tableRow;
  top9.forEach(function(country) {
    tableRow = "<tr><td>" + country.Country + "</td>" + "<td>" + country.TotalConfirmed + "</td>" + "<td>" + country.TotalRecovered + "</td>" + "<td>" + country.TotalDeaths + "</td></tr>";
    $("table").find("tbody").append(tableRow);
  });
  // $(table).find('tbody').append("<tr><td>"+country.Country+"</td></tr>");
}

$(function() {

  const mapConfig = {
    map: 'world_merc', //world_merc is name of file containing the map
    regionStyle: {
      initial: {
        fill: '#B8E186'
      },
      selected: {
        fill: "#3ca59d",
      },
    },
    regionsSelectable: true,
    regionsSelectableOne: true,
    title: "Covid-19 Confirmed Cases",
    backgroundColor: "#232A32",
    onRegionTipShow: function(e, el, code) {
      el.html(el.html() + ' - ' + covidMapData[code] + 'Cases');
    }
  };
  $('#world-map').vectorMap(mapConfig);
});
