import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    content: { type: String, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
