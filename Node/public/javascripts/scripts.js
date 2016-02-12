$(document).ready(function() {

	$('#file-upload, #start, #removeAll').hide();

	// Dropzone stuff to handle file uploading
	Dropzone.autoDiscover = false;
	var dropzone = new Dropzone( "#file-upload",{
		paramName: "file",	// The name that will be used to transfer the file
		maxFilesize: 4096,	// MB
		maxFiles: 100,		// Max number of files allowed to be uploaded
		addRemoveLinks: true,	// Removing files queued to be uploaded
		autoProcessQueue: false,	// Telling the dropzone to not automatically upload files
		parallelUploads: 100,	// How many files to process when the start button is clicked
		init: function(file) {
			// Checking to see which location to upload to
			this.on("processing", function(file) {
				if($('#onprem-upload').hasClass("active")) {
					this.options.url = "/api/onprem/public/form";
				}
			});
			// Refreshing the page when everything is done uploading
			this.on("queuecomplete", function (file) {
	            setTimeout(function(){
					location.reload(true);
				}, 1000);
	        });
	        // Hiding the start button until a file is added
	        this.on("addedfile", function(file){
	        	$('#start, #removeAll').removeClass("disabled");
	        	// Rearranging the details div, so that filename is above size
	        	$('.dz-details > div').each(function() {
	        		if($(this.parentNode.children[0]).hasClass("dz-size")) {
	        			$(this).prependTo(this.parentNode);
	        		}
	        	});
	        	$('.minimize').attr('style', 'display:none');
	        });
	        // If nothing is left in the queue, then disable the buttons
	        this.on("removedfile", function(file){
	        	if(this.getQueuedFiles().length == 0)
	        	{
	        		$('#start, #removeAll').addClass("disabled");
	        		$('.minimize').attr('style', 'display:block');
	        	}
	        });
		}
	});

	// Making the dropzone show up once a location is selected
	$('#obj-upload, #onprem-upload').click(function() {
		//$('#file-upload, .btn-container').show(500);
		if( $('#file-upload').css('display').toLowerCase() == 'none') {
			$('#file-upload').css("display", "table-cell").animate({height: "174px", width: ($('.upload').width()) }, 500);
			if( $('#start, #removeAll').css('display').toLowerCase() == 'none' ) {
	        		$('#start, #removeAll').css("display", "initial").animate({width: "125px", height: "35px"}, 500);
	        }
	    }
	});

	// Toggling the upload location
	$('#obj-upload').click(function() {
		$('#onprem-upload').removeClass("active");
		$('#obj-upload').addClass("active");
	});

	// Toggling the upload location
	$('#onprem-upload').click(function() {
		$('#obj-upload').removeClass("active");
		$('#onprem-upload').addClass("active");
	});

	// Button to raise the popup window and confirm
	$('#start').click(function() {
		dropzone.processQueue();
		$('#start').text("Uploading...").addClass("disabled");
		$('#obj-upload, #onprem-upload').addClass("disabled");
	});

	// Button to remove all files in the queue after confirmation
	$('#removeAll').click(function() {
		if(confirm("Are you sure you want to remove all files from the upload queue? This will not affect uploads already completed.")) {
			dropzone.removeAllFiles(true); // Adding the true parameter cancels all uploads in progress
		}
	});
	
	$('.minimize').click(function() {
		$('#file-upload').css("display", "block");
		$('#file-upload, #start, #removeAll').hide(500, function() {
			$('#file-upload, #start, #removeAll').css("height", "0px").css("width", "0px");
		});
		//$('#file-upload').animate({height: "0px", width: "0px" }, 500, function() {
			//$('#file-upload').attr("style", "display:none");
		//});
		//$('#start, #removeAll').animate({width: "0px", height: "0px"}, 500, function() {
		//	$('#start, #removeAll').attr("style", "display:none");
		//});
		$('#obj-upload, #onprem-upload').removeClass("active");
	});
	
	// Function to sort table
	$('#table').tablesorter( { 
		widgets: ['zebra'],	// Tells the table to be "striped"
		sortList: [[0,0]], 	// Sorting by the initial column
		sortInitialOrder: 'desc',
		headers: {
			1: {sorter: false},	// Removing sorting from the second and third columns
			2: {sorter: false}	// (zero indexed)
		}
	});

	// Function for deleting an item
	$('img').click(function() {
		// Grabbing the correct item
		var parent = $(this).parent().parent();
		var child = parent[0].children;
		// Confirmation in case of accidents
		if(confirm("Are you sure you want to delete '" + child[0].id + "'?")) {
			// Creating the delete form
			var path;
			if($(this).parent().parent().hasClass("objFile")) {
				path = "/api/obj/public/delete";
			}
			else {
				path = "/api/onprem/public/delete";
			}
			// AJAX Promise to send the delete request
			var post = $.ajax({
				url: path,
				data: {file: $(this).parent().parent().children().attr('id')},
				type: "POST"
			});
			post.done(function(p){
				location.reload(true);
			});
		}
	});

	// Opening an obj store file after it's been clicked
	$('.objName').click(function() {
		var file = $(this)[0].id;
		window.open("/api/obj/public/" + file);
	});

	// Opening onprem file after it's been clicked
	$('.onPremName').click(function() {
		var file = $(this)[0].id;
		window.open("/api/onprem/public/" + file);
	});

	// Single page functionality to show all files 
	$('#all').click(function() {
		$('.onPremFile, .objFile').attr('style', 'display:table-row;');
		$('#table').trigger('update');

		// Changing small UI elements
		$('#obj, #onprem').removeClass("active-tab");
		$('#all').addClass("active-tab");
	});

	// Single page functionality to show only store files 
	$('#obj').click(function() {
		$('.onPremFile').attr('style', 'display:none;');
		$('.objFile').attr('style', 'display:table-row;');
		$('#table').trigger('update');

		// Changing small UI elements
		$('#all, #onprem').removeClass("active-tab");
		$('#obj').addClass("active-tab");
	});

	// Single page functionality to show only onprem files 
	$('#onprem').click(function() {
		$('.objFile').attr('style', 'display:none;');
		$('.onPremFile').attr('style', 'display:table-row;');
		$('#table').trigger('update');

		// Changing small UI elements
		$('#all, #obj').removeClass("active-tab");
		$('#onprem').addClass("active-tab");
	});
});