---
title: 313 Carburetor 23 - NFV - network virtualization
date: 2017-01-05T21:40:00.000Z
tags:
  - carburetor
episode: 313
audio_url: https://m2.reversim.com/reversim313_carburetor23.mp3
cover_image: /images/blogger/b46effbb79d5f3bdf498.png
legacy_url: https://www.reversim.com/2017/01/313-carburetor-23-nfv-network.html
legacy_path: /2017/01/313-carburetor-23-nfv-network
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">אנחנו בפרק 313, קרבורטור עם אורי, רן ונתי מחברת </span><span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="http://getcloudify.org/" href="http://getcloudify.org/" rel="noreferrer nofollow noopener" target="_blank">cloudify</a></span></div>
<div dir="rtl" style="text-align: right;">
<div class="separator" style="clear: both; text-align: center;">
<a href="/images/blogger/49367f8c5c6a7d05759b.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="142" src="/images/blogger/b46effbb79d5f3bdf498.png" width="200"></a></div>
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><br></span></div>
<div dir="rtl" style="text-align: right;">
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">מה שנדבר עליו היום זה NFV, מה זה, מה זה לא, ומה עושים עם זה.</span></div>
<div dir="rtl" style="text-align: right;">
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><br></span></div>
<div dir="rtl" style="text-align: right;">
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">נתי: איך נראה דאטה סנטר של ספק אינטרנט? המון המון נתבים ושאר ציוד ייחודי ויקר.&nbsp;</span></div>
<div dir="rtl" style="text-align: right;">
<span class=" author-d-4z65zz66zl57z75zyiz66zfr2fz87zwz89znuj9vwyz76ze7fz90z97ibrkz68zc6z79zz74zz81zshh1z66zz89zsz82z">אורי</span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">: כשהתחלנו לבנות את הדאטה סנטר של אוטבריין אז קניית הציוד תקשורת הייתה יקרה מאוד ואמרנו רגע,למה שלא ניקח מכונת לינוקס ונשתמש בפתרונות תוכנה במקום ראוטרים וכו פיזיים? האם זה NFV</span></div>
<div dir="rtl" style="text-align: right;">
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">וככה גם המשכנו בעצם.&nbsp;</span></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
<span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">אז מה זה NFV? למה זה מעניין? למה שנרצה לעשות וירטואליזציה לרשת?</span></div>
<div dir="rtl" style="text-align: right;">
</div>
<div style="text-align: left;">
<span class="ace-all-bold-hthree"><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><b>Use cases:&nbsp;</b></span></span></div>
<ul class="listtype-bullet listindent1 list-bullet1">
<li><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">&nbsp;Carriers</span></li>
<li><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">&nbsp;FW</span></li>
<li><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">Self service&nbsp;</span></li>
<li><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">Security&nbsp;</span></li>
<li><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">Devops</span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm s-lparen"> </span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm h-lparen">(</span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"> </span><span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="https://docs.cloudfoundry.org/devguide/deploy-apps/blue-green.html" href="https://docs.cloudfoundry.org/devguide/deploy-apps/blue-green.html" rel="noreferrer nofollow noopener" target="_blank">blue green deployments</a></span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">)</span></li>
</ul>
<div>
<br></div>
<div>
<span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="http://www.lightreading.com/nfv/nfv-mano/atandt-taps-amdocs-as-ecomp-integration-partner/d/d-id/725030" href="http://www.lightreading.com/nfv/nfv-mano/atandt-taps-amdocs-as-ecomp-integration-partner/d/d-id/725030" rel="noreferrer nofollow noopener" target="_blank">&nbsp;Enterprises getting into NFV</a></span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">. &nbsp;Why ?</span></div>
<div>
<br></div>
<div>
<br></div>
<div>
<span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="http://getcloudify.org/2015/01/07/VNF-network-function-virtualization-netconf-yang-NFV.html" href="http://getcloudify.org/2015/01/07/VNF-network-function-virtualization-netconf-yang-NFV.html" rel="noreferrer nofollow noopener" target="_blank">Cloudify </a></span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">offering is </span><span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=tosca" href="https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=tosca" rel="noreferrer nofollow noopener" target="_blank">Tosca </a></span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">based, Yang files allow defining network services. Open source as opposed to Cisco etc.&nbsp;</span></div>
<div>
<span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="http://about.att.com/innovationblog/031716ecomp" href="http://about.att.com/innovationblog/031716ecomp" rel="noreferrer nofollow noopener" target="_blank">At&amp;t open sourcing eComp </a></span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">is a major disruption to this market.&nbsp;</span></div>
<div>
<span class="attrlink url author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm"><a class="attrlink" data-target-href="https://www.openstack.org/" href="https://www.openstack.org/" rel="noreferrer nofollow noopener" target="_blank">Openstack </a></span><span class=" author-d-iz88z86z86za0dz67zz78zz78zz74zz68zjz80zz71z9iz90za3wz65zz87zz87zz83zz90z8qs68c1z70ziz85z0nz82z2ez90zz83zz85zxz80zz86zz70zm">is one of the options for deployment&nbsp;</span></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m2.reversim.com/reversim313_carburetor23.mp3">כאן</a>, האזנה נעימה ותודה רבה לקטי על התמלול</div>
</div>
<div style="clear: both;"></div>
</div>
