import webapp2

import encodings.idna
import urlparse
import re
import json

import google.appengine.api.urlfetch


max_redirects = 10
url_regex = re.compile("^\w+:\/\/.+$")


def expander(self):
    # the json object to return
    data = {}

    # get the passed url
    url = self.request.get("url")

    # url has no scheme, default to http
    url = url if url_regex.match(url) is not None else "http://" + url

    # fix IDNA urls
    error = False
    try:
        # parse url into it's components
        parsed = list(urlparse.urlparse(url))
        # loop each label in the domain and convert them to ascii
        parsed[1] = ".".join([encodings.idna.ToASCII(domain)
                              for domain in parsed[1].split(".")])
        url = urlparse.urlunparse(parsed)
    except Exception as e:
        data["status"] = "InternalError"
        error = True

    # put together the basic data
    data["urls"] = [url]
    data["start_url"] = url
    data["end_url"] = url

    if not error:
        # if the input URL still doesn't start with http:// or https://,
        # discard it
        if not url.startswith("http://") and not url.startswith("https://"):
            data["status"] = "InvalidURL"
        else:
            requests = 0
            # follow redirects, max x times
            while (requests < max_redirects):
                requests += 1
                try:
                    # fetch the url _without_ following redirects,
                    # we handle them manually
                    response = google.appengine.api.urlfetch.fetch(
                        url, follow_redirects=False, allow_truncated=True,
                        method="HEAD")
                except:
                    data["status"] = "InvalidURL"
                    break

                if response.status_code in (300, 301, 302, 303, 307):
                    if "location" in response.headers:
                        url = response.headers["location"]
                    elif "Location" in response.headers:
                        url = response.headers["Location"]
                    else:
                        data["status"] = "OK"
                        break
                else:
                    # no more redirects; we're done
                    data["status"] = "OK"
                    break

                # add the current url to the urls array in the output
                data["urls"].append(url)
            else:
                data["status"] = "TooManyRedirects"

    data["redirects"] = len(data["urls"]) - 1
    data["end_url"] = url

    # output in json
    self.response.out.write(json.dumps(data))


class Expander(webapp2.RequestHandler):
    # direct both POST and GET to the expander method
    def post(self):
        expander(self)

    def get(self):
        expander(self)


application = webapp2.WSGIApplication([
    ("/expand", Expander),
], debug=True)
