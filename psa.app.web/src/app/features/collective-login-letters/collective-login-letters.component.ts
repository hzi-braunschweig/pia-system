import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../_services/data.service';
import { Location } from '@angular/common';
import { PlannedProband } from 'src/app/psa.app.core/models/plannedProband';

@Component({
  selector: 'app-collective.login-letters-template',
  templateUrl: './collective-login-letters.component.html',
  styleUrls: ['./collective-login-letters.component.scss'],
  preserveWhitespaces: false,
})
export class CollectiveLoginLettersComponent implements OnInit {
  currentDate = new Date();
  plannedProbands: PlannedProband[] = [];

  constructor(
    private router: Router,
    private dataService: DataService,
    private _location: Location
  ) {
    this.dataService.plannedProbandsForLetters.subscribe(
      (plannedProbands) => (this.plannedProbands = plannedProbands)
    );
  }

  ngOnInit(): void {
    if (this.plannedProbands.length === 0) {
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

        @media screen {
            #sidebar.opened+#page-container {
                left: 250px
            }
            #page-container {
                bottom: 0;
                right: 0;
                overflow: auto
            }
            .loading-indicator {
                display: none
            }
            .loading-indicator.active {
                display: block;
                position: absolute;
                width: 64px;
                height: 64px;
                top: 50%;
                left: 50%;
                margin-top: -32px;
                margin-left: -32px
            }
            .loading-indicator img {
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0
            }
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

        @keyframes swing {
            0 {
                transform: rotate(0)
            }
            10% {
                transform: rotate(0)
            }
            90% {
                transform: rotate(720deg)
            }
            100% {
                transform: rotate(720deg)
            }
        }

        @-webkit-keyframes swing {
            0 {
                -webkit-transform: rotate(0)
            }
            10% {
                -webkit-transform: rotate(0)
            }
            90% {
                -webkit-transform: rotate(720deg)
            }
            100% {
                -webkit-transform: rotate(720deg)
            }
        }

        @media screen {
            #sidebar {
                background-color: #2f3236;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjNDAzYzNmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMNCA0Wk00IDBMMCA0WiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2U9IiMxZTI5MmQiPjwvcGF0aD4KPC9zdmc+")
            }
            #outline {
                font-family: Georgia, Times, "Times New Roman", serif;
                font-size: 13px;
                margin: 2em 1em
            }
            #outline ul {
                padding: 0
            }
            #outline li {
                list-style-type: none;
                margin: 1em 0
            }
            #outline li>ul {
                margin-left: 1em
            }
            #outline a, #outline a:visited, #outline a:hover, #outline a:active {
                line-height: 1.2;
                color: #e8e8e8;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-decoration: none;
                display: block;
                overflow: hidden;
                outline: 0
            }
            #outline a:hover {
                color: #0cf
            }
            #page-container {
                background-color: #9e9e9e;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjOWU5ZTllIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiM4ODgiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=");
                -webkit-transition: left 500ms;
                transition: left 500ms
            }
            .pf {
                margin: 13px auto;
                box-shadow: 1px 1px 3px 1px #333;
                border-collapse: separate
            }
            .pc.opened {
                -webkit-animation: fadein 100ms;
                animation: fadein 100ms
            }
            .loading-indicator.active {
                -webkit-animation: swing 1.5s ease-in-out .01s infinite alternate none;
                animation: swing 1.5s ease-in-out .01s infinite alternate none
            }
            .checked {
                background: no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3goQDSYgDiGofgAAAslJREFUOMvtlM9LFGEYx7/vvOPM6ywuuyPFihWFBUsdNnA6KLIh+QPx4KWExULdHQ/9A9EfUodYmATDYg/iRewQzklFWxcEBcGgEplDkDtI6sw4PzrIbrOuedBb9MALD7zv+3m+z4/3Bf7bZS2bzQIAcrmcMDExcTeXy10DAFVVAQDksgFUVZ1ljD3yfd+0LOuFpmnvVVW9GHhkZAQcxwkNDQ2FSCQyRMgJxnVdy7KstKZpn7nwha6urqqfTqfPBAJAuVymlNLXoigOhfd5nmeiKL5TVTV+lmIKwAOA7u5u6Lped2BsbOwjY6yf4zgQQkAIAcedaPR9H67r3uYBQFEUFItFtLe332lpaVkUBOHK3t5eRtf1DwAwODiIubk5DA8PM8bYW1EU+wEgCIJqsCAIQAiB7/u253k2BQDDMJBKpa4mEon5eDx+UxAESJL0uK2t7XosFlvSdf0QAEmlUnlRFJ9Waho2Qghc1/U9z3uWz+eX+Wr+lL6SZfleEAQIggA8z6OpqSknimIvYyybSCReMsZ6TislhCAIAti2Dc/zejVNWwCAavN8339j27YbTg0AGGM3WltbP4WhlRWq6Q/btrs1TVsYHx+vNgqKoqBUKn2NRqPFxsbGJzzP05puUlpt0ukyOI6z7zjOwNTU1OLo6CgmJyf/gA3DgKIoWF1d/cIY24/FYgOU0pp0z/Ityzo8Pj5OTk9PbwHA+vp6zWghDC+VSiuRSOQgGo32UErJ38CO42wdHR09LBQK3zKZDDY2NupmFmF4R0cHVlZWlmRZ/iVJUn9FeWWcCCE4ODjYtG27Z2Zm5juAOmgdGAB2d3cBADs7O8uSJN2SZfl+WKlpmpumaT6Yn58vn/fs6XmbhmHMNjc3tzDGFI7jYJrm5vb29sDa2trPC/9aiqJUy5pOp4f6+vqeJ5PJBAB0dnZe/t8NBajx/z37Df5OGX8d13xzAAAAAElFTkSuQmCC)
            }
        }

        .ff0 {
            font-family: sans-serif;
            visibility: hidden;
        }

        @font-face {
            font-family: ff1;
            src: url(../../../assets/fonts/f1.woff)format("woff");
        }

        .ff1 {
            font-family: ff1;
            line-height: 0.861816;
            font-style: normal;
            font-weight: normal;
            visibility: visible;
        }

        @font-face {
            font-family: ff2;
            src: url(../../../assets/fonts/f2.woff)format("woff");
        }

        .ff2 {
            font-family: ff2;
            line-height: 0.895996;
            font-style: normal;
            font-weight: normal;
            visibility: visible;
        }

        @font-face {
            font-family: ff3;
            src: url(../../../assets/fonts/f3.woff)format("woff");
        }

        .ff3 {
            font-family: ff3;
            line-height: 0.669434;
            font-style: normal;
            font-weight: normal;
            visibility: visible;
        }

        .m0 {
            transform: matrix(0.250000, 0.000000, 0.000000, 0.250000, 0, 0);
            -ms-transform: matrix(0.250000, 0.000000, 0.000000, 0.250000, 0, 0);
            -webkit-transform: matrix(0.250000, 0.000000, 0.000000, 0.250000, 0, 0);
        }

        .m1 {
            transform: none;
            -ms-transform: none;
            -webkit-transform: none;
        }

        .v0 {
            vertical-align: 0.000000px;
        }

        .ls0 {
            letter-spacing: 0.000000px;
        }

        .sc_ {
            text-shadow: none;
        }

        .sc0 {
            text-shadow: -0.015em 0 transparent, 0 0.015em transparent, 0.015em 0 transparent, 0 -0.015em transparent;
        }

        @media screen and (-webkit-min-device-pixel-ratio:0) {
            .sc_ {
                -webkit-text-stroke: 0px transparent;
            }
            .sc0 {
                -webkit-text-stroke: 0.015em transparent;
                text-shadow: none;
            }
        }

        .ws0 {
            word-spacing: 0.000000px;
        }

        .fc3 {
            margin-left: 150px;
        }

        .fc2 {
            color: rgb(0, 0, 255);
        }

        .fc1 {
            color: rgb(0, 0, 0);
        }

        .fc0 {
            color: rgb(122, 162, 40);
        }

        .fs2 {
            font-size: 44.000000px;
        }

        .fs4 {
            font-size: 48.000000px;
        }

        .fs3 {
            font-size: 56.000000px;
        }

        .fs0 {
            font-size: 64.000000px;
        }

        .fs1 {
            font-size: 72.000000px;
        }

        .y17 {
            bottom: 5.741999px;
        }

        .y16 {
            bottom: 21.183998px;
        }

        .y15 {
            bottom: 36.626001px;
        }

        .y13 {
            bottom: 225.215988px;
        }

        .y18 {
            bottom: 237.000000px;
        }

        .y12 {
            bottom: 240.657989px;
        }

        .y11 {
            bottom: 256.100005px;
        }

        .y1d {
            bottom: 259.765002px;
        }

        .y10 {
            bottom: 286.984008px;
        }

        .yf {
            bottom: 302.425994px;
        }

        .ye {
            bottom: 317.868011px;
        }

        .y0 {
            bottom: 331.500000px;
        }

        .yd {
            bottom: 333.309997px;
        }

        .y1c {
            bottom: 337.494006px;
        }

        .yc {
            bottom: 364.193985px;
        }

        .yb {
            bottom: 379.635985px;
        }

        .ya {
            bottom: 395.078002px;
        }

        .y1b {
            bottom: 416.625995px;
        }

        .y9 {
            bottom: 425.962005px;
        }

        .y8 {
            bottom: 441.403991px;
        }

        .y7 {
            bottom: 456.846007px;
        }

        .y14 {
            bottom: 460.396008px;
        }

        .y6 {
            bottom: 472.287993px;
        }

        .y5 {
            bottom: 487.729995px;
        }

        .y1a {
            bottom: 499.468996px;
        }

        .y4 {
            bottom: 503.171996px;
        }

        .y3 {
            bottom: 534.055999px;
        }

        .y2 {
            bottom: 568.101006px;
        }

        .y19 {
            bottom: 195px;
        }

        .y1 {
            bottom: 659.846002px;
        }

        .h4 {
            height: 30.078125px;
        }

        .h5 {
            height: 31.582031px;
        }

        .h9 {
            height: 32.812500px;
        }

        .h8 {
            height: 38.281250px;
        }

        .h2 {
            height: 43.750000px;
        }

        .h6 {
            height: 47.350001px;
        }

        .h3 {
            height: 49.218750px;
        }

        .h1 {
            height: 393.000000px;
        }

        .h7 {
            height: 504.500000px;
        }

        .h0 {
            height: 792.000000px;
        }

        .w2 {
            width: 69.300003px;
        }

        .w1 {
            width: 469.500000px;
        }

        .w3 {
            width: 492.000000px;
        }

        .w0 {
            width: 612.000000px;
        }

        .x5 {
            left: 7.450000px;
        }

        .x0 {
            left: 70.500000px;
        }

        .x3 {
            left: 72.000000px;
        }

        .x6 {
            left: 77.500000px;
        }

        .x1 {
            left: 156.699997px;
        }

        .x2 {
            left: 233.108002px;
        }

        .x4 {
            left: 470.149994px;
        }

        @media print {
            .v0 {
                vertical-align: 0.000000pt;
            }
            .ls0 {
                letter-spacing: 0.000000pt;
            }
            .ws0 {
                word-spacing: 0.000000pt;
            }
            .fs2 {
                font-size: 58.666667pt;
            }
            .fs4 {
                font-size: 64.000000pt;
            }
            .fs3 {
                font-size: 74.666667pt;
            }
            .fs0 {
                font-size: 85.333333pt;
            }
            .fs1 {
                font-size: 96.000000pt;
            }
            .y17 {
                bottom: 7.655999pt;
            }
            .y16 {
                bottom: 28.245331pt;
            }
            .y15 {
                bottom: 48.834668pt;
            }
            .y13 {
                bottom: 300.287984pt;
            }
            .y18 {
                bottom: 316.000000pt;
            }
            .y12 {
                bottom: 320.877318pt;
            }
            .y11 {
                bottom: 341.466674pt;
            }
            .y1d {
                bottom: 346.353336pt;
            }
            .y10 {
                bottom: 382.645344pt;
            }
            .yf {
                bottom: 403.234659pt;
            }
            .ye {
                bottom: 423.824014pt;
            }
            .y0 {
                bottom: 442.000000pt;
            }
            .yd {
                bottom: 444.413329pt;
            }
            .y1c {
                bottom: 449.992008pt;
            }
            .yc {
                bottom: 485.591980pt;
            }
            .yb {
                bottom: 506.181314pt;
            }
            .ya {
                bottom: 526.770669pt;
            }
            .y1b {
                bottom: 555.501326pt;
            }
            .y9 {
                bottom: 567.949340pt;
            }
            .y8 {
                bottom: 588.538654pt;
            }
            .y7 {
                bottom: 609.128010pt;
            }
            .y14 {
                bottom: 613.861343pt;
            }
            .y6 {
                bottom: 629.717325pt;
            }
            .y5 {
                bottom: 650.306660pt;
            }
            .y1a {
                bottom: 665.958661pt;
            }
            .y4 {
                bottom: 670.895995pt;
            }
            .y3 {
                bottom: 712.074665pt;
            }
            .y2 {
                bottom: 757.468007pt;
            }
            .y19 {
                bottom: 260pt;
            }
            .y1 {
                bottom: 879.794669pt;
            }
            .h4 {
                height: 40.104167pt;
            }
            .h5 {
                height: 42.109375pt;
            }
            .h9 {
                height: 43.750000pt;
            }
            .h8 {
                height: 51.041667pt;
            }
            .h2 {
                height: 58.333333pt;
            }
            .h6 {
                height: 63.133334pt;
            }
            .h3 {
                height: 65.625000pt;
            }
            .h1 {
                height: 524.000000pt;
            }
            .h7 {
                height: 672.666667pt;
            }
            .h0 {
                height: 1056.000000pt;
            }
            .w2 {
                width: 92.400004pt;
            }
            .w1 {
                width: 626.000000pt;
            }
            .w3 {
                width: 656.000000pt;
            }
            .w0 {
                width: 816.000000pt;
            }
            .x5 {
                left: 9.933334pt;
            }
            .x0 {
                left: 94.000000pt;
            }
            .x3 {
                left: 96.000000pt;
            }
            .x6 {
                left: 103.333333pt;
            }
            .x1 {
                left: 208.933329pt;
            }
            .x2 {
                left: 310.810669pt;
            }
            .x4 {
                left: 626.866659pt;
            }
        }
        </style>
        </head>
        <body onload="window.print();window.close()">${printContents}</body>
      </html>
      `);
    popupWin.document.close();
  }
}
