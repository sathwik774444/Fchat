export default function Message({ message, isMine, apiUrl }) {
  const created = new Date(message.createdAt);
  const time = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`w-full flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm border text-sm whitespace-pre-wrap break-words ${
          isMine
            ? "bg-brand-500 text-white border-brand-600 rounded-br-sm"
            : "bg-white text-gray-900 border-gray-200 rounded-bl-sm"
        }`}
      >
        {!isMine && message.sender?.name ? (
          <div className="text-[11px] mb-1 opacity-70">{message.sender.name}</div>
        ) : null}

        {message.content ? <div>{message.content}</div> : null}

        {Array.isArray(message.attachments) && message.attachments.length > 0 ? (
          <div className="mt-2 space-y-2">
            {message.attachments.map((a) => {
              const isImage = a.mimeType?.startsWith("image/");
              const href = a.url?.startsWith("http") ? a.url : `${apiUrl}${a.url}`;

              return (
                <div key={a.url} className="">
                  {isImage ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      <img
                        src={href}
                        alt={a.originalName}
                        className="max-h-56 rounded-lg border border-black/10"
                      />
                    </a>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`block rounded-lg px-3 py-2 text-sm underline ${
                        isMine ? "bg-white/10" : "bg-gray-50"
                      }`}
                    >
                      {a.originalName}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className={`mt-1 text-[10px] ${isMine ? "text-white/80" : "text-gray-500"}`}>
          {time}
        </div>
      </div>
    </div>
  );
}
