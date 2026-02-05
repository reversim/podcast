---
title: "Summit 2015: Accord: A sane validation library for Scala / Tomer Gabel"
date: 2015-05-02T20:20:00.000Z
tags:
  - summit
audio_url: http://m.reversim.com/summit2015_open_source_2_Tomer_Gabel.mp3
legacy_url: https://www.reversim.com/2015/05/summit-2015-accord-sane-validation.html
legacy_path: /2015/05/summit-2015-accord-sane-validation
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
<br>
<br>
Accord is a validation library written in and for Scala. Compared to <a href="http://jcp.org/en/jsr/detail?id=303">JSR 303</a> and <a href="https://github.com/scalaz/scalaz/blob/scalaz-seven/core/src/main/scala/scalaz/Validation.scala">Scalaz validation</a> it aims to provide the following:<br>
<ul style="text-align: left;">
<li>Composable: Because JSR 303 is annotation based, validation rules cannot be composed (annotations cannot receive other annotations as parameters). This is a real problem with some Scala features, for example Options or collections. Accord's validation rules are trivially composable.</li>
<li>Simple: Accord provides a dead-simple story for validation rule definition by leveraging macros, as well as the validation call site (see example below).</li>
<li>Self-contained: Accord is macro-based but completely self-contained, and consequently only relies on the Scala runtime and reflection libraries.</li>
<li>Integrated: Other than providing its own DSL and matcher library, Accord is designed to easily integrate with other libraries, and provides out-of-the-box integration with <a href="https://github.com/wix/accord/wiki/Spring-Integration">Spring Validation</a>, <a href="https://github.com/wix/accord/wiki/Specs%C2%B2-Integration">Specs2</a> and <a href="https://github.com/wix/accord/wiki/ScalaTest-Integration">ScalaTest</a>.</li>
</ul>
Accord is developed and used at <a href="http://www.wix.com/">Wix</a> and distributed under the <a href="http://www.apache.org/licenses/LICENSE-2.0">Apache License, Version 2.0</a>, which basically means you can use and modify it freely. Feedback, bug reports and improvements are welcome!<br>
<br></div>
<iframe allowfullscreen="" frameborder="0" height="315" src="https://www.youtube-nocookie.com/embed/AyjrAfLQfBw?rel=0&amp;showinfo=0" width="560"></iframe><br>
<br>
<a href="http://m.reversim.com/summit2015_open_source_2_Tomer_Gabel.mp3">MP3</a></div>
<div style="clear: both;"></div>
</div>
