/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../_services/data.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-collective.sample-letters-template',
  templateUrl: './collective-sample-letters.component.html',
  styleUrls: ['./collective-sample-letters.component.scss'],
  preserveWhitespaces: false,
})
export class CollectiveSampleLettersComponent implements OnInit {
  currentDate = new Date();
  probands = [];

  constructor(
    private router: Router,
    private dataService: DataService,
    private _location: Location
  ) {
    this.dataService.probandsForLetters.subscribe(
      (probands) => (this.probands = probands)
    );
  }

  ngOnInit(): void {
    if (this.probands.length === 0) {
      this._location.back();
    }
  }

  backClicked(): void {
    this._location.back();
  }

  printPage(): void {
    const printContents = document.getElementById('print-section').innerHTML;
    const popupWin = window.open(
      '',
      '_blank',
      'top=0,left=0,height=100%,width=auto'
    );
    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
        <style>
        /*!
        * Base CSS
        * Copyright 2012,2013 Lu Wang <coolwanglu@gmail.com>
        * https://github.com/coolwanglu/pdf2htmlEX/blob/master/share/LICENSE
        */

        #sidebar {
         position: absolute;
         top: 0;
         left: 0;
         bottom: 0;
         width: 250px;
         padding: 0;
         margin: 0;
         overflow: auto
        }

        #page-container {
         position: absolute;
         top: 0;
         left: 0;
         margin: 0;
         padding: 0;
         border: 0
        }

        @media print {
         @page {
           margin: 0
         }
         html {
           margin: 0
         }
         body {
           margin: 0;
           -webkit-print-color-adjust: exact
         }
         #sidebar {
           display: none
         }
         #page-container {
           width: auto;
           height: auto;
           overflow: visible;
           background-color: transparent
         }
         .d {
           display: none
         }

         .pf{
           display:block;
           position: absolute;
             left: 0;
             top: 0;
         }

        .pf {
         position: relative;
         background-color: white;
         overflow: hidden;
         margin: 0;
         border: 0
        }

        .pc {
         position: absolute;
         border: 0;
         padding: 0;
         margin: 0;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         overflow: hidden;
         display: block;
         transform-origin: 0 0;
         -ms-transform-origin: 0 0;
         -webkit-transform-origin: 0 0
        }

        .pc.opened {
         display: block
        }

        .bf {
         position: absolute;
         border: 0;
         margin: 0;
         top: 0;
         bottom: 0;
         width: 100%;
         height: 100%;
         -ms-user-select: none;
         -moz-user-select: none;
         -webkit-user-select: none;
         user-select: none
        }

        .bi {
         position: absolute;
         border: 0;
         margin: 0;
         -ms-user-select: none;
         -moz-user-select: none;
         -webkit-user-select: none;
         user-select: none
        }

        @media print {
         .pf {
           margin: 0;
           display:block;
           box-shadow: none;
           page-break-after: always;
           page-break-inside: avoid
         }
         @-moz-document url-prefix() {
           .pf {
             overflow: visible;
             border: 1px solid #fff
           }
           .pc {
             overflow: visible
           }
         }

        .c {
         position: absolute;
         border: 0;
         padding: 0;
         margin: 0;
         overflow: hidden;
         display: block
        }

        .t {
         position: absolute;
         white-space: pre;
         font-size: 1px;
         transform-origin: 0 100%;
         -ms-transform-origin: 0 100%;
         -webkit-transform-origin: 0 100%;
         unicode-bidi: bidi-override;
         -moz-font-feature-settings: "liga" 0
        }

        .t:after {
         content: ''
        }

        .t:before {
         content: '';
         display: inline-block
        }

        .t span {
         position: relative;
         unicode-bidi: bidi-override
        }

        ._ {
         display: inline-block;
         color: transparent;
         z-index: -1
        }

        ::selection {
         background: rgba(127, 255, 255, 0.4)
        }

        ::-moz-selection {
         background: rgba(127, 255, 255, 0.4)
        }

        .pi {
         display: none
        }

        .d {
         position: absolute;
         transform-origin: 0 100%;
         -ms-transform-origin: 0 100%;
         -webkit-transform-origin: 0 100%
        }

        .it {
         border: 0;
         background-color: rgba(255, 255, 255, 0.0)
        }

        .ir:hover {
         cursor: pointer
        }

        /*!
        * Fancy styles
        * Copyright 2012,2013 Lu Wang <coolwanglu@gmail.com>
        * https://github.com/coolwanglu/pdf2htmlEX/blob/master/share/LICENSE
        */

        @keyframes fadein {
         from {
           opacity: 0
         }
         to {
           opacity: 1
         }
        }

        @-webkit-keyframes fadein {
         from {
           opacity: 0
         }
         to {
           opacity: 1
         }
        }

        .ff0{font-family:sans-serif;visibility:hidden;}
        .ff1{font-family:ff1;line-height:0.939453;font-style:normal;font-weight:normal;visibility:visible;}
        .ff2{font-family:ff2;line-height:0.938477;font-style:normal;font-weight:normal;visibility:visible;}
        .ff3{font-family:ff3;line-height:0.971191;font-style:normal;font-weight:normal;visibility:visible;}
        .ff4{font-family:ff4;line-height:0.690918;font-style:normal;font-weight:normal;visibility:visible;}
        .ff5{font-family:ff5;line-height:0.677246;font-style:normal;font-weight:normal;visibility:visible;}
        .m0{transform:matrix(0.250000,0.000000,0.000000,0.250000,0,0);-ms-transform:matrix(0.250000,0.000000,0.000000,0.250000,0,0);-webkit-transform:matrix(0.250000,0.000000,0.000000,0.250000,0,0);}
        .m1{transform:none;-ms-transform:none;-webkit-transform:none;}
        .v0{vertical-align:0.000000px;}
        .ls0{letter-spacing:0.000000px;}
        .sc_{text-shadow:none;}
        .sc0{text-shadow:-0.015em 0 transparent,0 0.015em transparent,0.015em 0 transparent,0 -0.015em  transparent;}

        @media print{
          .v0{vertical-align:0.000000pt;}
          .ls0{letter-spacing:0.000000pt;}
          .ws0{word-spacing:0.000000pt;}
          ._0{margin-left:-1.560000pt;}
          ._2{width:1.877333pt;}
          ._6{width:3.754667pt;}
          ._4{width:6.394667pt;}
          ._5{width:11.440000pt;}
          ._3{width:15.429333pt;}
          ._7{width:19.536000pt;}
          ._1{width:1038.341333pt;}
          .fs0{font-size:40.000000pt;}
          .fs1{font-size:58.666667pt;}
          .fs2{font-size:64.000000pt;}
          .y0{bottom:0.000000pt;}
          .y4{bottom:14.422671pt;}
          .ya{bottom:20.265335pt;}
          .y3{bottom:25.921336pt;}
          .y9{bottom:36.937327pt;}
          .y2{bottom:37.420003pt;}
          .y8{bottom:53.609334pt;}
          .y7{bottom:70.281334pt;}
          .y26{bottom:86.438680pt;}
          .y6{bottom:86.953333pt;}
          .y25{bottom:100.236003pt;}
          .y24{bottom:114.033325pt;}
          .yb{bottom:117.066650pt;}
          .y23{bottom:127.830648pt;}
          .y22{bottom:141.628011pt;}
          .y21{bottom:155.425334pt;}
          .y20{bottom:183.019979pt;}
          .y1f{bottom:196.817322pt;}
          .y44{bottom:210.513345pt;}
          .y1e{bottom:210.614665pt;}
          .y1d{bottom:224.411987pt;}
          .y43{bottom:228.417316pt;}
          .y1c{bottom:238.209310pt;}
          .y42{bottom:246.321328pt;}
          .y1b{bottom:252.006632pt;}
          .y41{bottom:264.225329pt;}
          .y1a{bottom:279.601318pt;}
          .y40{bottom:282.909341pt;}
          .y19{bottom:293.398661pt;}
          .y3f{bottom:300.813353pt;}
          .y18{bottom:307.196004pt;}
          .y17{bottom:320.993327pt;}
          .y3e{bottom:326.717325pt;}
          .y16{bottom:334.790670pt;}
          .y15{bottom:348.587992pt;}
          .y3d{bottom:352.621337pt;}
          .y14{bottom:362.385335pt;}
          .y3c{bottom:388.429320pt;}
          .y13{bottom:403.777323pt;}
          .y12{bottom:417.574666pt;}
          .y3b{bottom:424.237325pt;}
          .y11{bottom:431.372009pt;}
          .y3a{bottom:442.141317pt;}
          .y10{bottom:445.169332pt;}
          .yf{bottom:458.966665pt;}
          .y39{bottom:460.045324pt;}
          .ye{bottom:472.764002pt;}
          .y38{bottom:477.949320pt;}
          .yd{bottom:486.561330pt;}
          .y37{bottom:495.853322pt;}
          .yc{bottom:500.358668pt;}
          .y36{bottom:513.757323pt;}
          .y35{bottom:549.565328pt;}
          .y34{bottom:567.469330pt;}
          .y33{bottom:585.373330pt;}
          .y32{bottom:621.181335pt;}
          .y31{bottom:639.085337pt;}
          .y30{bottom:656.989338pt;}
          .y2f{bottom:692.797342pt;}
          .y2e{bottom:728.605335pt;}
          .y5{bottom:752.666667pt;}
          .y2d{bottom:764.771997pt;}
          .y2c{bottom:783.943999pt;}
          .y2b{bottom:801.847997pt;}
          .y2a{bottom:819.751998pt;}
          .y29{bottom:837.655999pt;}
          .y28{bottom:855.559999pt;}
          .y27{bottom:873.463999pt;}
          .y1{bottom:894.399989pt;}
          .h5{height:29.121094pt;}
          .h2{height:29.160156pt;}
          .h7{height:43.500000pt;}
          .h6{height:46.520833pt;}
          .h1{height:46.800003pt;}
          .h3{height:96.333333pt;}
          .h4{height:537.333333pt;}
          .h0{height:1122.666667pt;}
          .w2{width:42.466667pt;}
          .w3{width:222.533325pt;}
          .w1{width:246.866679pt;}
          .w0{width:793.333333pt;}
          .x0{left:0.000000pt;}
          .x4{left:34.015750pt;}
          .x1{left:94.466665pt;}
          .x6{left:132.600001pt;}
          .xa{left:161.750666pt;}
          .x9{left:192.284007pt;}
          .x8{left:196.993337pt;}
          .x7{left:251.793335pt;}
          .x2{left:430.933350pt;}
          .x5{left:482.000010pt;}
          .x3{left:570.800008pt;}
        }
        </style>
        </head>
        <body onload="window.print();window.close()">${printContents}</body>
      </html>
      `);
    popupWin.document.close();
  }
}
