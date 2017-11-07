var startDate, endDate;
var dataSet;
var monthNames = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function onLoad() {
	$("#calendar_view")[0].style.display = "block";
    loadData();
}

function loadData() {
	var q = d3.queue();
	q.defer(d3.csv, "data/data.csv");
	q.awaitAll(function(e, csvData) {
		if (e) throw e;
		else if (csvData[0].length === 0) return;

        for (var i = 0; i < csvData[0].length; i ++) {
            //adjust dataSet to proper json
            csvData[0][i]["time"] = new Date(csvData[0][i]["time"].replace(" UTC", "Z").replace(" ", "T"));
            csvData[0][i]["name"] = csvData[0][i]["name"].replace('\$','');
            csvData[0][i]["properties"] = JSON.parse(csvData[0][i]["properties"]);
        }

        //sort dataSet by ascending time
        dataSet = csvData[0].sort(sortByTimeAscending);


        //if the last day of record earlier than the current month/year, display the month of the last record
		//if the first day record later than the current month/year, display the month of the first record
        var dataStartDate = dataSet[0]["time"];
        var dataEndDate = dataSet[dataSet.length - 1]["time"];
        var d = new Date();
        setStartEndDate(d);

        if (!(dataStartDate instanceof Date) || !(dataEndDate instanceof Date)) {
            displayMode('month')(dataSet, d);
        }
        else if (dataEndDate < startDate) {
            displayMode('month')(dataSet, dataEndDate);
        }
        else if (dataStartDate > endDate) {
            displayMode('month')(dataSet, dataStartDate);
        }
	});
}

function openTab(event, tabName) {
	var i, tabContent, tabLinks;
	
	//hide tabs
	tabContent = $('.tab_content');
	for (i = 0 ; i < tabContent.length ; i ++) {
		tabContent[i].style.display = "none";
	}
	
	//deactivate tabs
	tabLinks = $('.tab_links');
	for (i = 0 ; i < tabLinks.length ; i ++) {
		tabLinks[i].className = tabLinks[i].className.replace("active", ""); 
	}
	
	//show current tab
	$("#" + tabName)[0].style.display = "block";
	event.currentTarget.className += " active";
}

function sortByTimeAscending(a, b) {
    // Dates will be casted to numbers automagically:
    return a.time - b.time;
}

function displayMode(s) {
	switch(s) {
		case 'month':
			return displayMonth;
		case 'week':
			return displayWeek;
		default:
			return displayMonth;
	}
}

function MonthGrid(date) {
	this.curYear = date.getFullYear();
	this.prevMon = monthNames[(date.getMonth() - 1) % 12];
	this.curMon = monthNames[date.getMonth()];
    this.nextMon = monthNames[(date.getMonth() + 1) % 12];
    this.dataRow = [];
    this.dataRow.rowHtml;
    this.dataRow.dayHtml = {};
}

//display month including target day
function displayMonth(data, date) {
	if (typeof data === 'undefined' || !data) return;

	setStartEndDate(date);

	//prepare the grid
	var grid = new MonthGrid(date);
	
	var gridRows = Math.ceil((startDate.getDay() + endDate.getDate()) / 7);
	for (var i = 0 ; i < gridRows ; i ++) {
		grid.dataRow.push([]);
		grid.dataRow[i].rowHtml = "<tr class='cal_body_week_container' id='week-row-" + i + "'>";
        grid.dataRow[i].dayHtml = [];
		for (var j = 0 ; j < 7 ; j ++) {
			grid.dataRow[i].dayHtml.push([]);
			grid.dataRow[i].dayHtml[j] = "<td class='cal_body_day_cell'><div class='cal_body_day'>"
				+ new Date(startDate.getFullYear(), startDate.getMonth(), i * 7 + j - startDate.getDay()).getDate() +
				"</div></td>";
        }
        //grid.dataRow[i].rowHtmlEnd = "</tr>";
	}


	//display grid
	var thead = $(".cal_toolbar_center").append("<h2>" + grid.curYear + " " + grid.curMon + "</h2>" );
	for (i = 0 ; i < gridRows ; i ++) {
        $("#cal_tbody").append(grid.dataRow[i].rowHtml);
		for (j = 0 ; j < 7 ; j ++) {
			$("#week-row-" + i).append(grid.dataRow[i].dayHtml[j]);
		}
		//tbody.append(grid.dataRow[i].rowHtmlEnd);
	}

}

//display week including target day
function displayWeek(data, date) {

}


function setStartEndDate(d) {
        startDate = new Date(d.getFullYear(), d.getMonth(), 1);
        endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
