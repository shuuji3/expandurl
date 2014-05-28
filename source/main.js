var doc;

// initialization
$(function()
{
	// javascript enabled, remove the message and display the tabs
	$("body > h2").hide();
	$(".tabs, .panes").show();
	
	// initialize tabs
	$(".tabs").tabs(".panes>.pane", { history: true });
	
	// set up some variables
	doc = {
		button: $("input[type=button]"),
		input: $("input[type=text]"),
		gif: $("#loading"),
		result: $("#result"),
		start_url: $("#start_url>a"),
		end_url: $("#end_url>a"),
		redirects: $("#redirects"),
		redirects_text: $("#redirects>h3"),
		list: $("#redirects>ol"),
		initial: $("#initialtext"),
		error: $("#error")
	}
	
	// event: button is clicked.
	doc.button.click(function(event)
	{
		// take no chances :P
		try
		{
			// disable button (until expanding is done)
			doc.button.attr("disabled", true);
			
			// fade out everything, show loading gif
			doc.initial.fadeOut("fast", function() {
			doc.result.fadeOut("fast", function() {
			doc.error.fadeOut("fast", function() {
			doc.redirects.slideUp("fast", function() {
			doc.gif.fadeIn("fast", function()
			{
				try
				{
					// do a request to the api
					$.post("/expand", { url: doc.input.val() }, function(data)
					{
						// done loading, remove the gif
						doc.gif.fadeOut("fast", function()
						{
							try
							{
								if (!data)
								{
									// nothing returned; something is wrong
									error("Internal error");
									return;
								}
								if (data.redirects > 0)
								{
									// at least one redirect, so we're cool
									redirects = data.redirects;
									doc.start_url.attr("href", data.start_url).text(data.start_url);
									doc.end_url.attr("href", data.end_url).text(data.end_url);
									doc.result.fadeIn("fast");
									show_redirects(data.urls, "All redirects:");
								}
								else if (data.status == "TooManyRedirects")
								{
									// too many redirects, possible loop
									error("Too many redirects!", data);
									show_redirects(data.urls, "This is how far we got:")
									
								}
								else if (data.status == "InvalidURL")
								{
									// invalid url and no redirects
									error("Invalid URL!", data);
								}
								else
								{
									// valid url, no redirects
									error("URL doesn't redirect anywhere!", data);
								}
								// we're done, reenable button for further expands
								doc.button.attr("disabled", false);
							}
							catch (e)
							{
								error("Internal error");
							}
						});
					}, "json");
				}
				catch (e)
				{
					error("Internal error");
				}
			});
			});
			});
			});
			});
		}
		catch (e)
		{
			error("Internal error");
		}
	});
	
	// ajax error
	$("html").ajaxError(function(event, request, settings)
	{
		doc.gif.fadeOut("fast", function()
		{
			error("Internal error");
		});
	});
	
	// select and give focus to the textbox on document ready
	$(document).ready(function()
	{
		doc.input.select().focus();
	});
	
	// submit on enter
	doc.input.keydown(function(event)
	{
		if (event.keyCode == 13)
		{
			$("input[type=button]").click();
			return false;
		}
	});
});

// shows an error
function error(msg, data)
{
	doc.error.text(msg).fadeIn("slow");
}

function show_redirects(urls, title)
{
	// set the title of the list
	doc.redirects_text.text(title);
	
	// reset the list and append all the urls
	doc.list.empty();
	$.each(urls, function(index, url)
	{
		doc.list.append("<li><a></a></li>").children().last().children().text(url).attr("href", url);
	});
	
	doc.redirects.slideDown("slow");
}
