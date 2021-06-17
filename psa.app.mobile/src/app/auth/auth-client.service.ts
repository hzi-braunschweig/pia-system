import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Login, User, UserWithStudyAccess } from './auth.model';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class AuthClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/user/';
  }

  constructor(private http: HttpClient, private endpoint: EndpointService) {}

  login(credentials: Login): Promise<User> {
    return this.http
      .post<User>(this.getApiUrl() + 'login', credentials)
      .toPromise();
  }

  loginWithToken(credentials: Login): Promise<User> {
    const headers = new HttpHeaders({
      Authorization: localStorage.getItem('token_login'),
    });
    return this.http
      .post<User>(this.getApiUrl() + 'login', credentials, { headers })
      .toPromise();
  }

  requestNewPassword(userId: string, token: string): Promise<any> {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.append('Authorization', token);
    }
    return this.http
      .put(
        this.getApiUrl() + 'newPassword',
        { user_id: userId },
        { headers, responseType: 'text' }
      )
      .toPromise();
  }

  changePassword(credentials: object): Promise<void> {
    return this.http
      .post<void>(this.getApiUrl() + 'changePassword', credentials)
      .toPromise();
  }

  logout(username: string): Promise<void> {
    return this.http
      .post<void>(this.getApiUrl() + 'logout', { username })
      .toPromise();
  }

  getUsers(): Promise<any> {
    return this.http.get(this.getApiUrl() + 'users').toPromise();
  }

  getUser(username: string): Promise<UserWithStudyAccess> {
    return this.http
      .get<UserWithStudyAccess>(this.getApiUrl() + 'users/' + username)
      .toPromise();
  }

  deleteUser(username: string): Promise<void> {
    return this.http
      .delete<void>(this.getApiUrl() + 'users/' + username)
      .toPromise();
  }

  postUser(postData: object): Promise<UserWithStudyAccess> {
    return this.http
      .post<UserWithStudyAccess>(this.getApiUrl() + 'users', postData)
      .toPromise();
  }

  putUser(username: string, putData: object): Promise<UserWithStudyAccess> {
    return this.http
      .put<UserWithStudyAccess>(this.getApiUrl() + 'users/' + username, putData)
      .toPromise();
  }
}
