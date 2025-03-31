import User, { type IUser } from "../model/user.model";

class UserQuery {
  public static async createUser(data: Partial<IUser>): Promise<IUser> {
    const newUser = new User(data);
    await newUser.save();
    return newUser;
  }

  public static async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  public static async findAllUser(): Promise<IUser | null | any> {
    return User.find().lean().exec();
  }

  //   public static async findUserById(id: string): Promise<IUser | null> {
  //     return User.findOne({ _id: id })
  //       .select("email _id accounts lastLogin latestLogin")
  //       .populate({
  //         path: "accounts",
  //         select: "_id name",
  //       });
  //   }

  //   public static async UpdateUserLogin(email: string): Promise<IUser | null> {
  //     const now = new Date();
  //     const user = await User.findOne({ email });

  //     return User.findByIdAndUpdate(
  //       { _id: user?._id },
  //       { $set: { lastLogin: user?.latestLogin, latestLogin: now } },
  //       { new: true }
  //     );
  //   }

  //   public static async countDocuments(query: any): Promise<number> {
  //     return User.countDocuments(query).exec();
  //   }

  //   public static async aggregate(pipeline: any): Promise<any> {
  //     return User.aggregate(pipeline);
  //   }
}

export default UserQuery;
