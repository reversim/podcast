---
title: "Summit 2016: Flush your head! - an HTTP performance optimization tool /
  YONATAN MEVORACH"
date: 2017-09-02T20:52:00.000Z
audio_url: http://m2.reversim.com/summit2016_Open_Source_D1_Yonatan_Me.mp3
legacy_url: https://www.reversim.com/2017/09/summit-2016-flush-your-head-http.html
legacy_path: /2017/09/summit-2016-flush-your-head-http
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
If you take delivering a fast web experience seriously, then you have to make sure you’re utilizing HTTP’s ability to serve the response in chunks.<br>
Using “Chunked Encoding” improves performance by letting your server flush critical parts of the document (like the head tag) early, which means the browser can start downloading other resources sooner.<br>
And even though this has been part of the HTTP protocol since 1997(!) there hasn’t been a tool that lets you see when a flush takes place.. up until now.<br>
“Chunk Scatter” is a tool dedicated to solve this by visualizing the point in time each flush occurred. It also shows what part of the document the client gets in each chunk, and lets you compare one endpoint to another (e.g. staging vs. production).<br>
“Chunk Scatter” is used by engineers at Yahoo, Adobe, Atlassian, Radware, Kayak, and others to test how different configurations and environments handle flushing.</div>
<br>
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/f2u0w0n64Z8" frameborder="0" allowfullscreen=""></iframe><br>
<br>
<a href="http://m2.reversim.com/summit2016_Open_Source_D1_Yonatan_Me.mp3">MP3</a>
</div>
<div style="clear: both;"></div>
</div>
