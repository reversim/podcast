---
title: 332 Data infrastructure at Juno with Uri Shamay
date: 2018-01-23T10:56:00.000Z
episode: 332
audio_url: https://m2.reversim.com/reversim332_data-processing-framewordks.mp3
cover_image: /images/blogger/9e2de5c61301b9b02b7a.jpg
legacy_url: https://www.reversim.com/2018/01/332-data-infrastructure-at-juno-with.html
legacy_path: /2018/01/332-data-infrastructure-at-juno-with
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
בפרק זה אורי ורן מארחים את <a href="http://cmpxchg16.me/">אורי שמאי</a> לשיחה על Data Infrastructure בחברה שלו Juno</div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div class="separator" style="clear: both; text-align: center;">
<a href="/images/blogger/30635a2a817ac7f39164.jpg" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="462" data-original-width="822" height="111" src="/images/blogger/9e2de5c61301b9b02b7a.jpg" width="200"></a></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
</div>
<ul dir="rtl" style="text-align: right;">
<li>קצת על ג׳ונו החברה ואלו בעיות הם פותרים</li>
<li>על אורי, הנסיון שלו ותחביבים שקשורים לתכנה וחומרה...</li>
<li>איך התחילו ב Spark, ועברו ל DataFlow&nbsp;</li>
<li>על המוטיביה לעבוד עם AirFlow ועל האלטרנטיבות שלו (Luigi ועוד)&nbsp;</li>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m2.reversim.com/reversim332_data-processing-framewordks.mp3">כאן</a>, האזנה נעימה</div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
לינקים:&nbsp;</div>
<ul class="listtype-bullet listindent1 list-bullet1"><ul class="listtype-bullet listindent2 list-bullet2">
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">Apache-Spark: </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://spark.apache.org/" rel="noreferrer nofollow noopener" target="_blank">https://spark.apache.org</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">Luigi: </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://github.com/spotify/luigi" rel="noreferrer nofollow noopener" target="_blank">https://github.com/spotify/luigi</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">Airbnb Airflow</span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k s-lparen"> </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k h-lparen">(</span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">became Apache project): </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://github.com/apache/incubator-airflow" rel="noreferrer nofollow noopener" target="_blank">https://github.com/apache/incubator-airflow</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">BE programming language Go: </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://golang.org/" rel="noreferrer nofollow noopener" target="_blank">https://golang.org</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">Unified project for data processing, what Google Cloud Dataflow became: </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://beam.apache.org/" rel="noreferrer nofollow noopener" target="_blank">https://beam.apache.org</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">AWS events streams by Kinesis Firehose: </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://aws.amazon.com/kinesis/data-firehose/" rel="noreferrer nofollow noopener" target="_blank">https://aws.amazon.com/kinesis/data-firehose/</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">BigData frameworks from cloud providers:</span></li>
<ul class="listtype-bullet listindent3 list-bullet3">
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">AWS: EMR </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://aws.amazon.com/emr/" rel="noreferrer nofollow noopener" target="_blank">https://aws.amazon.com/emr/</a></span></li>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://cloud.google.com/dataproc/" rel="noreferrer nofollow noopener" target="_blank">https://cloud.google.com/dataproc/</a></span></li>
</ul>
<li><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k">Google Cloud Dataflow: </span><span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuiz88zfw9tz78zhcz78zaz85z4sz82z9z78zz66zaz83zoz78zz122znbz68zz75zf6k url"><a class="dynamiclink" href="https://cloud.google.com/dataflow/" rel="noreferrer nofollow noopener" target="_blank">https://cloud.google.com/dataflow/</a></span></li>
</ul>
</ul>
</div>
<div style="clear: both;"></div>
</div>
