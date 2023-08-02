const roleInput = document.getElementById("role-input")
const saveBtn = document.getElementById("save-btn")

saveBtn.addEventListener("click", () => {
    console.log(roleInput.value);
    chrome.runtime.sendMessage({
        action: "check_role",
        data: roleInput.value,
      });
})