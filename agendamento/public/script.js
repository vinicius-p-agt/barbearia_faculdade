document.addEventListener("DOMContentLoaded", function () {
    let selectedService = null;
    let selectedDate = null;
    let selectedTime = null;
    let beardServiceSelected = false;

    const resumoNomeCliente = document.querySelector("#resumo-nome-cliente");
    const resumoTelefone = document.querySelector("#resumo-telefone");
    const resumoServico = document.querySelector("#resumo-servico");
    const resumoData = document.querySelector("#resumo-data");
    const resumoHorario = document.querySelector("#resumo-horario");
    const resumoValor = document.querySelector("#resumo-valor");
    const resumoBarba = document.querySelector("#resumo-barba");

    const inputServico = document.querySelector("#input-servico");
    const inputValor = document.querySelector("#input-valor");
    const inputHora = document.querySelector("#input-hora");

    document.querySelectorAll(".service-card").forEach((card) => {
        card.addEventListener("click", function () {
            document.querySelectorAll(".service-card").forEach((c) => c.classList.remove("selected"));
            this.classList.add("selected");
            selectedService = this;

            const servico = this.getAttribute("data-servico");
            const valor = this.getAttribute("data-valor");

            inputServico.value = servico;
            inputValor.value = valor;

            updateSummary();
            updateTotal();
        });
    });

    document.querySelector("input[type='date']").addEventListener("change", function () {
        selectedDate = this.value.split("-").reverse().join("/");
        updateSummary();
    });

    document.querySelectorAll(".time-slot").forEach((slot) => {
        slot.addEventListener("click", function () {
            document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("selected"));
            this.classList.add("selected");
            selectedTime = this.innerText;
            inputHora.value = selectedTime;
            updateSummary();
        });
    });

    document.querySelector("input[name='nome_cliente']").addEventListener("input", function () {
        resumoNomeCliente.innerText = this.value || "Nome do Cliente";
    });

    document.querySelector("input[name='telefone']").addEventListener("input", function () {
        resumoTelefone.innerText = this.value || "(00) 00000-0000";
    });

    document.querySelectorAll('input[name="barba"]').forEach((input) => {
        input.addEventListener("change", function () {
            beardServiceSelected = this.value === "Sim";
            resumoBarba.innerText = this.value;
            updateSummary();
            updateTotal();
        });
    });

    function updateSummary() {
        if (selectedService) {
            const serviceName = selectedService.querySelector("h3").innerText;
            resumoServico.innerText = serviceName;
        } else {
            resumoServico.innerText = "---";
        }

        resumoData.innerText = selectedDate || "__/__/____";
        resumoHorario.innerText = selectedTime || "--:--";
    }

    function updateTotal() {
        let total = 0;

        if (selectedService) {
            const valor = parseFloat(selectedService.getAttribute("data-valor"));
            total += valor;
        }

        if (beardServiceSelected) {
            total += 25;
        }

        resumoValor.innerText = `R$${total.toFixed(2).replace(".", ",")}`;
    }

    function resetForm() {
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        beardServiceSelected = false;

        document.querySelectorAll(".service-card").forEach((c) => c.classList.remove("selected"));
        document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("selected"));

        resumoNomeCliente.innerText = "Nome do Cliente";
        resumoTelefone.innerText = "(00) 00000-0000";
        resumoServico.innerText = "---";
        resumoData.innerText = "__/__/____";
        resumoHorario.innerText = "--:--";
        resumoValor.innerText = "R$0,00";
        resumoBarba.innerText = "Não";

        document.getElementById("agendamento-form").reset();
    }

    document.getElementById("agendamento-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const nomeCliente = document.querySelector("input[name='nome_cliente']").value;
        const telefone = document.querySelector("input[name='telefone']").value;
        const data = document.querySelector("input[name='data']").value;
        const servico = inputServico.value;
        const valor = inputValor.value;
        const hora = inputHora.value;
        const barba = document.querySelector("input[name='barba']:checked")?.value;

        if (!nomeCliente || !telefone || !data || !hora || !servico || !barba) {
            alert("Por favor, preencha todas as informações antes de confirmar o agendamento.");
            return;
        }

        const agendamento = {
            nome_cliente: nomeCliente,
            telefone,
            data,
            hora,
            servico,
            valor,
            barba
        };

        fetch('/agendamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agendamento)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.mensagem || 'Agendamento confirmado!');
            resetForm();
        })
        .catch(error => {
            alert('Erro ao salvar o agendamento: ' + error.message);
            console.error('Detalhes do erro:', error);
        });
    });
});
