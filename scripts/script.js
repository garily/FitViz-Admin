function onLoad() {
	$("#calendar")[0].style.display = "block";
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
	event.currentTarget.className += "active";
}
