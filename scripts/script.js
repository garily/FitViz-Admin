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
    this.dataRow.day.ifCurrentMonth= true;
}

function DateCellContent() {
	this.click = 0;
	this.submit = 0;
	this.view = 0;
	this.signin = 0;
}

function onLoad() {
	$("#calendar_view")[0].style.display = "block";
    loadData();
}



function loadData() {
	var q = d3.queue();
	dataSet = [];

	for (var i = 1; i <= 32 ; i ++) {
		q.defer(d3.csv, "data/" + i + ".csv");
	}

	//q.defer(d3.csv, "data/data.csv");
	q.awaitAll(function(error, sourceData) {
		if (error) throw error;
		//else if (sourceData[0].length === 0) return;

		for (var j = 0; j < sourceData.length ; j ++) {
            for (i = 0; i < sourceData[j].length; i ++) {
                //adjust dataSet to proper json
                sourceData[j][i].time = new Date(sourceData[j][i].time.replace(" UTC", "Z").replace(" ", "T"));
                sourceData[j][i].name = sourceData[j][i].name.replace('\$','').replace("Signed in or refreshed page", "signin");
                sourceData[j][i].properties = JSON.parse(sourceData[j][i].properties);
            }
            dataSet.push(sourceData[j].sort(byTimeAscending));
		}


        //sort dataSet by ascending time
        //dataSet = sourceData[0].sort(byTimeAscending);


        //if the last day of record earlier than the current month/year, display the month of the last record
		//if the first day record later than the current month/year, display the month of the first record
        var dataStartDate = findStartDate(dataSet);
        var dataEndDate = findEndDate(dataSet);

        var d = new Date();
        setStartEndDate(d);

        if (!(dataStartDate instanceof Date) || !(dataEndDate instanceof Date)) {
            setContent('month')(dataSet, d);
        }
        else if (dataEndDate < startDate) {
            setContent('month')(dataSet, dataEndDate);
        }
        else if (dataStartDate > endDate) {
            setContent('month')(dataSet, dataStartDate);
        }

        openTab(this, 'calendar_view', null);

        //set onClickListeners for tabs and navigation buttons
		$("#calendar_tab").click(function () {
            openTab(event, 'calendar_view', null);
		});
        $("#day_tab").click(function() {
            openTab(event, 'day_view', dataEndDate);
		});
        $("#navbutton_left").click(function() {
        	setContent('month')(dataSet, new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1));
        });
        $("#navbutton_right").click(function() {
        	setContent('month')(dataSet, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1));
        });
        $("#navbutton_today").click(function() {
            setContent('month')(dataSet, new Date());
        });
	});
}

function openTab(event, tabContentName, date) {
	var i, tabContent, tabLinks;
	var dayTab = $("#day_tab")[0];
	var calendarTab = $("#calendar_tab")[0];

	//If not already in day view
    if (date instanceof Date && tabContentName === 'day_view' && dayTab.className.toString().search("active") === -1) {
    	setContent('day')(dataSet, date);
    }

    //hide tabs
    tabContent = $('.tab_content');
    for (i = 0 ; i < tabContent.length ; i ++) {
        tabContent[i].style.display = "none";
    }

    //deactivate tabs
    tabLinks = $('.tab_links');
    for (i = 0 ; i < tabLinks.length ; i ++) {
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    }

    //show targeted tab
    $("#" + tabContentName)[0].style.display = "block";

    switch(tabContentName) {
		case 'day_view':
			dayTab.className += " active";
			break;
		case 'calendar_view':
			calendarTab.className += " active";
			break;
		default:
			event.currentTarget.className += " active";
	}

}


function findStartDate(dataArr) {
	var startDate = dataArr[0][0].time;
	for (var i = 0; i < dataArr.length ; i ++) {
		if (startDate > dataArr[i][0].time) startDate = dataArr[i][0].time;
	}
	return startDate;
}

function findEndDate(dataArr) {
    var endDate = dataArr[0][dataArr[0].length - 1].time;
    for (var i = 0; i < dataArr.length ; i ++) {
        if (endDate < dataArr[i][dataArr[i].length - 1].time) endDate = dataArr[i][dataArr[i].length - 1].time;
    }
    return endDate;

}

function byTimeAscending(a, b) {
    // Dates will be casted to numbers automatically:
    return a.time - b.time;
}

function setContent(s) {
	switch(s) {
		case 'month':
			return setMonthViewContent;
		case 'day':
			return setDayViewContent;
		default:
			return setMonthViewContent;
	}
}

//display month including target day
function setMonthViewContent(data, date) {
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
                grid.dataRow[i].day[j].ifCurrentMonth = false;
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
			var if_current_month = !(grid.dataRow[i].day[j].ifCurrentMonth === false) ? "" : " not_current_month";

			//populating signin, view, click, and submit counts
            var div_signin = content.signin === 0 ?
                "" : "<div class='record_action signin'>" + content.signin +  "</div>";
            var div_view = content.view === 0 ?
                "" : "<div class='record_action view'>" + content.view +  "</div>";
			var div_click = content.click === 0 ?
				"" : "<div class='record_action click'>" + content.click +  "</div>";
			var div_submit = content.submit === 0 ?
                "" : "<div class='record_action submit'>" + content.submit +  "</div>";
			//var div_body_date_current_month =

			tbody.children()[i].innerHTML += "<td class='cal_body_date_cell'><div class='cal_body_date"
				+ if_current_month + "'>"
            	+ grid.dataRow[i].day[j].date.getDate()
            	+ "</div>" + "<div class='cal_body_date_content'><p>"
				+ div_signin + div_view + div_click + div_submit
				+ "</p></div></td>";

		}
	}

	var dayCells = $(".cal_body_date_cell");
		dayCells.each( function(index) {
			$(this).on( "click", function() {
				//set onClickListener for non-null cells only
				if (this.children[1].innerHTML === "<p></p>") return;

				//move to day view
				openTab(event, 'day_view', grid.dataRow[Math.floor(index / 7)].day[(index % 7)].date);
			});
		});
}

//display
function setDayViewContent(data, date) {
    if (typeof data === 'undefined' || !data) return;

    var singleDayData = [];
    var tmp;
    var dayCards = $("#day_cards");
    dayCards.html("");
    console.log(dayCards);

    for (var i = 0 ; i < data.length ; i ++) {
    	tmp = data[i].filter(function (e) {
            return (e.time >= new Date(date.getFullYear(), date.getMonth(), date.getDate()))
                && (e.time <= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59));
        });
		if (tmp.length !== 0) singleDayData.push(tmp);
	}

    singleDayData.forEach(function (e) {
        var ifDaily = false;
		var ifCalendar = true;
		var ifRecom = false;
		var ifClinician = false;


    	e.forEach(function (el) {
    		if (el.name === "click") {
    			if (el.properties.tag === "a") {
    				switch (el.properties.id) {
						case "ui-id-1":
							ifDaily = true;
							break;
						case "ui-id-3":
							ifRecom = true;
							break;
						case "ud-id-4":
							ifClinician = true;
							break;
						default:
							break;
    				}
                }
			}
		});
    	dayCards.append("<div class='day_card'><h4>User:&nbsp;"
			+ e[0].user_id + "</h4><table class='day_card_table'>"
			+ "<tr><td class='day_card_table_content'>"
			+ "<div style='display: inline-block; background-color: #69bcbe; width: 10px; height: 10px'></div>"
			+ "&nbsp;&nbsp;Daily Tab</td><td class='day_card_table_content'>" + boolToYesNo(ifDaily) + "</td></tr>"
			+ "<tr><td class='day_card_table_content'>"
            + "<div style='display: inline-block; background-color: #6c82a0; width: 10px; height: 10px'></div>"
            + "&nbsp;&nbsp;Calendar Tab</td><td class='day_card_table_content'>" + boolToYesNo(ifCalendar) + "</td></tr>"
			+ "<tr><td class='day_card_table_content'>"
            + "<div style='display: inline-block; background-color: #f5eb81; width: 10px; height: 10px'></div>"
            + "&nbsp;&nbsp;Recommendation Tab</td><td class='day_card_table_content'>" + boolToYesNo(ifRecom) + "</td></tr>"
			+ "<tr><td class='day_card_table_content'>"
            + "<div style='display: inline-block; background-color: #df6a40; width: 10px; height: 10px'></div>"
            + "&nbsp;&nbsp;Clinician Tab</td><td class='day_card_table_content'>" + boolToYesNo(ifClinician) + "</td></tr></table></div>"
		);
	});

}

function boolToYesNo(boolean) {
	return boolean ? "Yes" : "No";
}

//set startDate and endDate for visible calendar
function setStartEndDate(d) {
    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

function fillDateCell(data, d) {
	var result = new DateCellContent();
	var userId = -1;
	var ifClick = false;
	var ifView = false;
	var ifSubmit = false;
	var ifSignIn = false;

	for (var j = 0 ; j < data.length ; j ++) {
        if (userId !== data[j][0].user_id) {
            userId = data[j][0].user_id;
            ifClick = false;
            ifView = false;
            ifSubmit = false;
            ifSignIn = false;
        }
        for (var i = 0 ; i < data[j].length ; i ++) {
            if (data[j][i].time <= new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
                && data[j][i].time >= new Date(d.getFullYear(), d.getMonth(), d.getDate())) {
                switch (data[j][i].name) {
                    case "click":
                        if (!ifClick) {
                        	result.click++;
                        	ifClick = true;
                        }
                        break;
                    case "view":
                    	if (!ifView) {
                            result.view++;
                            ifView = true;
						}
                        break;
                    case "submit":
                    	if (!ifSubmit) {
                            result.submit++;
                    		ifSubmit = true;
						}
                        break;
                    case "signin":
                    	if (!ifSignIn) {
                            result.signin ++;
                            ifSignIn = true;
						}
                        break;
                    default:
                        break;
                }
            }
        }
	}

	return result;
}