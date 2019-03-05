import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './../../socket.service';
import { AppService } from './../../app.service';

import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ChatMessage } from './chat';
import { CheckUser } from './../../CheckUser';


@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css'],
  providers: [SocketService]
})

export class ChatboxComponent implements OnInit {

  @ViewChild('scrollMe', { read: ElementRef })

  public scrollMe: ElementRef;



  public authToken: any;
  public userInfo: any;
  public userList: any = [];
  public disconnectedSocket: boolean;

  public scrollToChatTop: boolean = false;

  public receiverId: any;
  public receiverName: any;
  public previousChatList: any = [];
  public messageText: any;
  public messageList: any = []; // stores the current message list display in chat box
  public pageValue: number = 0;
  public loadingPreviousChat: boolean = false;

  public onlineunSeenUserList: any = [];
  public unSeenUserList: any = [];
  public newUnseenMessageList: any = [];
  public seenFlag: boolean = false;
  public unseenFlag: boolean = false;
  public pageValue1: number = 0;
  public unSeenOnlineUserList: any = [];
  public unseenUserId;
  public unseenUserName;
  public flag: boolean[] = [false];


  constructor(
    public AppService: AppService,
    public SocketService: SocketService,
    public router: Router,
    private toastr: ToastrManager,

  ) {






  }



  ngOnInit() {

    this.authToken = Cookie.get('authtoken');

    this.userInfo = this.AppService.getUserInfoFromLocalstorage();

    this.receiverId = Cookie.get("receiverId");

    this.receiverName = Cookie.get('receiverName');

    console.log(this.receiverId, this.receiverName)

    if (this.receiverId != null && this.receiverId != undefined && this.receiverId != '') {
      this.userSelectedToChat(this.receiverId, this.receiverName)
    }

    //this.checkStatus();

    this.verifyUserConfirmation();

    //console.log(this.userList);
    this.getOnlineUserList()
    this.getUnseenChatOfUser();

    this.getMessageFromAUser();

    //console.log(this.userList+'-----------------------//////////-******////////////////-++++++');






  }


  /* public checkStatus: any = () => {
 
     if (Cookie.get('authtoken') === undefined || Cookie.get('authtoken') === '' || Cookie.get('authtoken') === null) {
 
       this.router.navigate(['/']);
 
       return false;
 
     } else {
 
       return true;
 
     }
 
   }*/ // end checkStatus



  public verifyUserConfirmation: any = () => {

    this.SocketService.verifyUser()
      .subscribe((data) => {

        this.disconnectedSocket = false;

        this.SocketService.setUser(this.authToken);
        //this.getOnlineUserList();

      });
  }

  public getOnlineUserList: any = () => {

    this.SocketService.onlineUserList()
      .subscribe((userList) => {

        this.userList = [];
        //console.log(userList +".......");

        for (let x in userList) {

          let temp = { 'userId': x, 'name': userList[x], 'unread': 0, 'chatting': false, 'flag': 0 };

          this.userList.push(temp);

        }

        console.log(this.userList);

      }); // end online-user-list
  }

  // chat related methods 


  public getPreviousChatWithAUser: any = () => {
    let previousData = (this.messageList.length > 0 ? this.messageList.slice() : []);

    this.SocketService.getChat(this.userInfo.userId, this.receiverId, this.pageValue * 10)
      .subscribe((apiResponse) => {

        console.log(apiResponse);

        if (apiResponse.status == 200) {

          this.messageList = apiResponse.data.concat(previousData);

        } else {

          this.messageList = previousData;
          this.toastr.warningToastr('No Messages available')



        }

        this.loadingPreviousChat = false;

      }, (err) => {

        this.toastr.errorToastr('some error occured')


      });

  } // end get previous chat with any user


  public loadEarlierPageOfChat: any = () => {

    this.loadingPreviousChat = true;

    this.pageValue++;
    this.scrollToChatTop = true;

    this.getPreviousChatWithAUser()

  } // end loadPreviousChat

  public userSelectedToChat: any = (id, name) => {
    this.seenFlag = false;

    console.log("setting user as active")

    // setting that user to chatting true   
    this.userList.map((user) => {
      if (user.userId == id) {
        user.chatting = true;
      }
      else {
        user.chatting = false;
      }
    })

    Cookie.set('receiverId', id);

    Cookie.set('receiverName', name);


    this.receiverName = name;

    this.receiverId = id;

    this.messageList = [];

    this.pageValue = 0;

    let chatDetails = {
      userId: this.userInfo.userId,
      senderId: id
    }


    this.SocketService.markChatAsSeen(chatDetails);

    this.getPreviousChatWithAUser();

  } // end userBtnClick function






  public sendMessageUsingKeypress: any = (event: any) => {

    if (event.keyCode === 13) { // 13 is keycode of enter.

      this.sendMessage();

    }

  } // end sendMessageUsingKeypress

  public sendMessage: any = () => {

    if (this.messageText) {

      let chatMsgObject: ChatMessage = {
        senderName: this.userInfo.firstName + " " + this.userInfo.lastName,
        senderId: this.userInfo.userId,
        receiverName: Cookie.get('receiverName'),
        receiverId: Cookie.get('receiverId'),
        message: this.messageText,
        createdOn: new Date()
      } // end chatMsgObject
      console.log(chatMsgObject);
      this.SocketService.SendChatMessage(chatMsgObject)
      this.pushToChatWindow(chatMsgObject)


    }
    else {
      this.toastr.warningToastr('text message can not be empty')

    }

  } // end sendMessage

  public pushToChatWindow: any = (data) => {

    this.messageText = "";
    this.messageList.push(data);
    this.scrollToChatTop = false;


  } // end push to chat window

  public getMessageFromAUser: any = () => {

    this.SocketService.chatByUserId(this.userInfo.userId)
      .subscribe((data) => {


        (this.receiverId == data.senderId) ? this.messageList.push(data) : '';

        this.toastr.successToastr(`${data.senderName} says : ${data.message}`)

        this.scrollToChatTop = false;

      });//end subscribe

  } // end get message from a user 


  public logout: any = () => {

    this.AppService.logout()
      .subscribe((apiResponse) => {

        if (apiResponse.status === 200) {
          console.log("logout called")
          Cookie.delete('authtoken');

          Cookie.delete('receiverId');

          Cookie.delete('receiverName');

          this.SocketService.exitSocket()

          this.router.navigate(['/']);

        } else {
          this.toastr.errorToastr(apiResponse.message)

        } // end condition

      }, (err) => {
        this.toastr.errorToastr('some error occured')


      });

  } // end logout

  public showUserName = (name: string) => {
    this.toastr.successToastr("you are chatting with" + name)
  }

  public getUnseenChatOfUser: any = () => {
    this.SocketService.getUnseenChat(this.userInfo.userId).subscribe((apiResponse) => {
      this.unSeenUserList = [];
      this.unSeenOnlineUserList = [];

      for (let x in apiResponse.data) {
        let temp1 = { 'userId': apiResponse.data[x].userId, 'name': apiResponse.data[x].firstName + " " + apiResponse.data[x].lastName }
        console.log(temp1);
        this.unSeenUserList.push(temp1);
      }

      for (let y in this.userList) {
        for (let x in this.unSeenUserList) {
          if (this.unSeenUserList[x].userId == this.userList[y].userId) {
            this.unSeenOnlineUserList.push(this.unSeenUserList[x]);
            this.unSeenUserList.splice(x, 1);
          }
          console.log(this.unSeenOnlineUserList);

        }
      }



      /*for (let y in this.userList){
        for(let x in this.unSeenOnlineUserList){
          if(this.unSeenOnlineUserList[x].userId == this.userList[y].userId){
            this.flag[y]=true;
          }
        }
      }*/

      console.log(this.userList + '++++++');
      console.log(this.unSeenOnlineUserList + '***************-------------***************');
      for (let x in this.unSeenOnlineUserList) {
        for (let y in this.userList) {

          this.checkFlag(this.userList[y], this.unSeenOnlineUserList[x])

        }

      }
      console.log(this.userList);






    }, (err) => {
      this.toastr.errorToastr('some error occured')
    });
  }


  public getUnseenChatMessageofUser = (senderId, ) => {
    this.SocketService.getUnseenChatList(this.userInfo.userId, senderId, this.pageValue1 * 10).subscribe((apiResponse) => {
      this.newUnseenMessageList = [];

      if (apiResponse.status == 200) {
        for (let x in apiResponse.data) {
          this.newUnseenMessageList.push(apiResponse.data[x]);
          this.unseenFlag = true;
          this.pageValue1 = 0;
        }
        console.log(this.newUnseenMessageList);
      }
    })
  }


  public unseenUserChatView = (senderId, senderName) => {
    this.seenFlag = true;

    Cookie.set('unseenSenderId', senderId);
    Cookie.set('unseenSenderName', senderName);

    this.unseenUserId = Cookie.get("unseenSenderId");
    this.unseenUserName = Cookie.get("unseenSenderName");



    this.getUnseenChatMessageofUser(this.unseenUserId);



  }


  public getPreviousChatWithAUserForUnseen: any = () => {

    let previousData = (this.newUnseenMessageList.length > 0 ? this.newUnseenMessageList.slice() : []);

    console.log(this.newUnseenMessageList)
    console.log(this.newUnseenMessageList.length)
    this.SocketService.getChat(this.userInfo.userId, this.unseenUserId, this.pageValue * 10)
      .subscribe((apiResponse) => {

        console.log(apiResponse);

        if (apiResponse.status == 200) {


          if (this.unseenFlag == true) {
            this.newUnseenMessageList = apiResponse.data;
            this.unseenFlag = false;
          } else {
            this.newUnseenMessageList = apiResponse.data.concat(previousData)
          }
          console.log(this.newUnseenMessageList)
          console.log(this.newUnseenMessageList.length)
        } else {
          this.toastr.warningToastr('No Messages available')



        }



        this.loadingPreviousChat = false;


      }, (err) => {

        this.toastr.errorToastr('some error occured')


      });

  }


  public loadUnseenEarlierPageOfChat: any = () => {

    this.loadingPreviousChat = true;

    console.log(this.pageValue1)
    this.scrollToChatTop = true;

    this.getPreviousChatWithAUserForUnseen()
    this.pageValue1++;

  }
  //function to combine list of user seen7unseen

  public checkFlag(userlistobj, unSeenOnlineUserListobj) {
    if (userlistobj.userId == unSeenOnlineUserListobj.userId) {
      userlistobj.flag = 1;
    } else {
      userlistobj.flag = userlistobj.flag * 1;
    }
    console.log(userlistobj.flag + "-----------***")
  }


























}
