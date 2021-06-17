import { Component, OnDestroy, OnInit } from '@angular/core';
import { DialogNewSormasProbandComponent } from 'src/app/dialogs/new-sormas-proband-dialog/new-sormas-proband-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs/Subscription';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';

@Component({
  templateUrl: 'sormas-iframe.component.html',
  styleUrls: ['sormas-iframe.component.scss'],
})
export class SormasIframeComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['pseudonym', 'firstname', 'lastname', 'email'];
  dataSource: {
    pseudonym: string;
    firstname: string;
    lastname: string;
    email: string;
    uuid: string;
  }[];
  probandSuccess: false;
  subscription: Subscription;
  hasParseError = false;
  hasInvalidEmail = false;

  constructor(private userService: AuthService, public dialog: MatDialog) {
    const probandLocalStorageKey = 'sormasProband';

    try {
      const sormasProband = JSON.parse(
        localStorage.getItem(probandLocalStorageKey)
      );
      this.dataSource = [
        {
          pseudonym: '',
          firstname: sormasProband.firstname,
          lastname: sormasProband.lastname,
          email: this.checkMultipleEmailsAndExtractFirstOne(
            sormasProband.email
          ),
          uuid: sormasProband.uuid,
        },
      ];
      localStorage.removeItem(probandLocalStorageKey);
      this.checkEmailValidity(this.dataSource[0].email);
    } catch (exc) {
      this.hasParseError = true;
    }
  }

  async ngOnInit(): Promise<void> {
    if (!this.hasParseError) {
      try {
        // load pseudonym if user exists
        const user = await this.userService.getUserByIDS(
          this.dataSource[0].uuid
        );
        this.dataSource[0].pseudonym = user.username;
      } catch (e) {
        if (e.status !== 404) {
          console.error(e);
        }
      }
    }
  }

  addSormasProband(): void {
    const dialogRef = this.dialog.open(DialogNewSormasProbandComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
      data: {
        email: this.dataSource[0].email,
        uuid: this.dataSource[0].uuid,
      },
    });

    this.subscription = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.probandSuccess = result.isSuccess;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  checkEmailValidity(email): void {
    const emailFC = new FormControl(email, [
      Validators.required,
      Validators.email,
    ]);
    this.hasInvalidEmail = !emailFC.valid;
  }

  checkMultipleEmailsAndExtractFirstOne(emails): string {
    let emailsArr = [];
    let email = '';
    const searchStrHead = emails.substr(0, emails.indexOf('@') + 1);
    // The split delimiters could be used in emails before the '@', therefore the split function acts on the remaining string after the '@'
    const searchStrTail = emails.substr(emails.indexOf('@') + 1, emails.length);
    emailsArr = searchStrTail.split(/&|\/|\\|_|;|\||:|"|\s|,/);
    email = searchStrHead + emailsArr[0];
    return email.trim();
  }
}
