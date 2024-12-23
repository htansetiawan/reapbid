export class Player {
  uid: string;
  email: string;
  displayName: string;
  currentBid: number | null;
  hasSubmittedBid: boolean;
  lastBidTime: number | null;
  isTimedOut?: boolean;

  constructor(uid: string, email: string, displayName?: string) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName || email;
    this.currentBid = null;
    this.hasSubmittedBid = false;
    this.lastBidTime = null;
    this.isTimedOut = false;
  }

  static fromFirebaseUser(user: { uid: string; email: string | null; displayName: string | null }): Player {
    if (!user.email) {
      throw new Error('Email is required for player creation');
    }
    return new Player(user.uid, user.email, user.displayName || undefined);
  }

  toJSON() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      currentBid: this.currentBid,
      hasSubmittedBid: this.hasSubmittedBid,
      lastBidTime: this.lastBidTime,
      isTimedOut: this.isTimedOut
    };
  }
}
