var startDate, endDate;
var dataSet;
var monthNames = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function MonthGrid(date) {
    this.curYear = date.getFullYear();
    this.curMon = monthNames[date.getMonth()];
    this.dataRow = [];
    this.dataRow.day = {};
    this.dataRow.day.date = {};
    this.dataRow.day.content = {};
    this.dataRow.day.if_current_month = true;
}

function DateCellContent() {
	this.click = [];
	this.submit = [];
	this.view = [];
	this.signin = [];
}

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
            csvData[0][i].time = new Date(csvData[0][i].time.replace(" UTC", "Z").replace(" ", "T"));
            csvData[0][i].name = csvData[0][i].name.replace('\$','').replace("Signed in or refreshed page", "signin");
            csvData[0][i].properties = JSON.parse(csvData[0][i].properties);
        }

        //sort dataSet by ascending time
        dataSet = csvData[0].sort(sortByTimeAscending);


        //if the last day of record earlier than the current month/year, display the month of the last record
		//if the first day record later than the current month/year, display the month of the first record
        var dataStartDate = dataSet[0].time;//["time"];
        var dataEndDate = dataSet[dataSet.length - 1].time;
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

        //set onClickListeners for navigation buttons
        $("#navbutton_left").click(function() {
        	displayMode('month')(dataSet, new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1));
        });
        $("#navbutton_right").click(function() {
        	displayMode('month')(dataSet, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1));
        });
        $("#navbutton_today").click(function() {
            displayMode('month')(dataSet, new Date());
        });
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

//display month including target day
function displayMonth(data, date) {
	if (typeof data === 'undefined' || !data) return;

	setStartEndDate(date);

	//prepare the grid
	var grid = new MonthGrid(date);
	
	var gridRows = Math.ceil((startDate.getDay() + endDate.getDate()) / 7);
	for (var i = 0 ; i < gridRows ; i ++) {
		grid.dataRow.push([]);
        grid.dataRow[i].day = [];
		for (var j = 0 ; j < 7 ; j ++) {
			grid.dataRow[i].day.push([]);
			grid.dataRow[i].day[j].date = new Date(startDate.getFullYear(),
				startDate.getMonth(), i * 7 + j + 1 - startDate.getDay());
			//if not current month
			if ((i * 7 + j + 1 - startDate.getDay() <= 0)
				|| (i * 7 + j + 1 - startDate.getDay() > endDate.getDate())) {
                grid.dataRow[i].day[j].if_current_month = false;
			}
			grid.dataRow[i].day[j].content = fillDateCell(data, grid.dataRow[i].day[j].date);
        }
	}


    var tbody = $("#cal_tbody");
	//refresh body
	tbody.html("");

	//display grid
	$(".cal_toolbar_center").html("<h2>" + grid.curYear + " " + grid.curMon + "</h2>" );
	for (i = 0 ; i < gridRows ; i ++) {
        tbody.append("<tr class='cal_body_week_container' id='week-row-" + i + "'>");
		for (j = 0 ; j < 7 ; j ++) {
			var content = grid.dataRow[i].day[j].content;
			var if_current_month = !(grid.dataRow[i].day[j].if_current_month === false) ? "" : " not_current_month";

			//populating signin, view, click, and submit counts
            var div_signin = content.signin.length === 0 ?
                "" : "<div class='record_action signin'>" + content.signin.length +  "</div>";
            var div_view = content.view.length === 0 ?
                "" : "<div class='record_action view'>" + content.view.length +  "</div>";
			var div_click = content.click.length === 0 ?
				"" : "<div class='record_action click'>" + content.click.length +  "</div>";
			var div_submit = content.submit.length === 0 ?
                "" : "<div class='record_action submit'>" + content.submit.length +  "</div>";
			//var div_body_date_current_month =

			tbody.children()[i].innerHTML += "<td class='cal_body_date_cell'><div class='cal_body_date"
				+ if_current_month + "'>"
            	+ grid.dataRow[i].day[j].date.getDate()
            	+ "</div>" + "<div class='cal_body_date_content'><p>"
				+ div_signin + div_view + div_click + div_submit
				+ "</p></div></td>";
		}
		//tbody.append(grid.dataRow[i].rowHtmlEnd);
	}

    $(".cal_body_date_cell").click(function() {
    	//set onClickListener for non-null cells only
    	if (this.children[1].innerHTML === "") return;

        //move to day view
    	openTab(event, 'day_view');
    	$("#day")[0].className += " active";
    });
}

//display week including target day
function displayWeek(data, date) {

}

function fillDateCell(arr, d) {
	var result = new DateCellContent();
	for (var i = 0 ; i < arr.length; i ++) {
		if (arr[i].time <= new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
        	&& arr[i].time >= new Date(d.getFullYear(), d.getMonth(), d.getDate())) {
			switch (arr[i].name) {
				case "click":
					result.click.push(arr[i].properties);
					break;
				case "view":
					result.view.push(arr[i].properties);
					break;
				case "submit":
					result.submit.push(arr[i].properties);
					break;
				case "signin":
					result.signin.push(arr[i].properties);
					break;
				default:
					break;
			}
		}
	}
	return result;
}

//set startDate and endDate for visible calendar
function setStartEndDate(d) {
        startDate = new Date(d.getFullYear(), d.getMonth(), 1);
        endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
